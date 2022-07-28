const cds = require('@sap/cds');
const sendmail = require('./libs/sendmail.js');
const updateStatus = require('./libs/updateStatus.js');
const setMailEntityFieldControl = require('./libs/setMailEntityFieldControl.js')
const getWhiteLists = require('./libs/getWhiteLists.js')
const checkRecipient = require('./libs/checkRecipient.js')
const getAttachments = require('./libs/getAttachments.js')
const successMessage = 'Mail sent successfully.'
const blockedMessage = 'Recipient is not in whitelist.'
const apiWarningMessage = 'Mail requests with multiple recipients processed with errors. Verify with mail service admin to resend emails.'
const apiSuccessMessage = 'Mail requests with multiple recipients processed successfully.'
const uiSuccessMessage = 'Mail request sent and status updated successfully.'
const uiWarningMessage = 'Resending not allowed for successful entries. Refresh screen to update entries statuses.'

module.exports = (srv) => {
    const { mailrequests, whitelists, attachments } = srv.entities;
    //Before Create -> Send mail and update status
    srv.before(['CREATE'], 'mailrequests', async (req) => {
        console.log("Before create event");
        const whitelists_entries = await getWhiteLists(whitelists);
        console.log("Processing mail to:",req.data.recipient);
        const isAllowed = await checkRecipient(whitelists_entries, req.data.recipient);
        if (isAllowed) {
            try {
                await sendmail(req.data);
                req.data.status = 'C';
                req.data.message = successMessage;
            }
            catch (error) {
                console.log("Error in sending mail:", error.response.data.error.message)
                req.data.status = 'O';
                req.data.message = error.response.data.error.message;
                return;
            }
        } else {
            console.log("Error in sending mail:", blockedMessage)
            req.data.status = 'O';
            req.data.message = blockedMessage;
            return;
        }

        console.log("After sending mail: ",req.data);
    })

    //For failed mails -> Action sendmail
    srv.on('sendmail', async (req) => {
        console.log("ON Send Action");
        const { mailrequests } = srv.entities;
        // const id = req.params[0].ID;
        const id = req.params[0];
        console.log("Sending mail manually ID:", id);

        //get mailrequest entity (without attachment)
        const query_get_req_details = SELECT.one
            .from(mailrequests)
            .where`ID=${id}`;
        const result = await cds.run(query_get_req_details);

        //check entry status
        if (result.status === 'O') {

            //check whitelist
            const whitelists_entries = await getWhiteLists(whitelists);
            const isAllowed = await checkRecipient(whitelists_entries, result.recipient);

            //Process old data without type defined
            if(result.type == null){
                result.type = "Text";
            }

            if (isAllowed) {
                try {
                    //get attachment
                    const entryAttachments = await getAttachments(attachments, id)
                    if (entryAttachments) {
                        Object.assign(result, { attachments: entryAttachments })
                    }
                    //actual resending
                    await sendmail(result);
                }
                catch (error) {
                    console.log(error.response.data.error.message);
                    req.error(`Error in sending mail: ${error.response.data.error.message}`)
                    await updateStatus(mailrequests, result.ID, 'O', error.response.data.error.message);
                    return;
                }
            } else {
                req.error(`Error in sending mail: ${blockedMessage}`)
                await updateStatus(mailrequests, result.ID, 'O', blockedMessage);
                return;
            }
            await updateStatus(mailrequests, result.ID, 'C', successMessage);
            req.info(uiSuccessMessage)
        } else {
            req.info(uiWarningMessage)
        }
    })

    //After read -> Determine status and availability of sendmail action
    srv.after('READ', 'mailrequests', (result) => {
        console.log('[AFTER READ]')
        if (Array.isArray(result)) {
            for (let i of result.entries()) {
                setMailEntityFieldControl(i[1])
            }
        } else {
            setMailEntityFieldControl(result)
        }
        console.log(result)
    })

    //Multiple Recipient
    //Note: let -> only in scope of block
    srv.on('mass_email', async (req) => {
        console.log('Mass email action');
        let emails = [];

        for (let recipientEntry of req.data.mailrequests.multiRecipient.entries()) {
            console.log("Processing recipient:", recipientEntry[1].email);
            let email = {
                sender: req.data.mailrequests.sender,
                recipient: recipientEntry[1].email,
                subject: req.data.mailrequests.subject,
                type: "",
                body: req.data.mailrequests.body
            };

            //Email Content Type
            if(req.data.mailrequests.type){
                email.type = req.data.mailrequests.type
            }else{
                req.data.mailrequests.type = "Text"
            }

            let query = INSERT.into(mailrequests).entries(email);
            let result = await cds.run(query);

            // Push -> 1, index = 0
            let index = emails.push(result.req.data) - 1;
            Object.assign(emails[index], { attachments: [] });

            // Insert attachments
            for (let attachmentEntry of req.data.mailrequests.attachments.entries()) {
                let attachment = {
                    parent_ID: result.req.data.ID,
                    name: attachmentEntry[1].name,
                    contentType: attachmentEntry[1].contentType,
                    contentBytes: attachmentEntry[1].contentBytes
                };
                query = INSERT.into(attachments).entries(attachment);
                await cds.run(query);
                emails[index].attachments.push(attachment);
            }
        }

        const whitelists_entries = await getWhiteLists(whitelists);

        // Entries created successfully, attempt to send out the email entries
        for (let emailEntry of emails.entries()) {
            const isAllowed = await checkRecipient(whitelists_entries, emailEntry[1].recipient);

            if (isAllowed) {
                try {
                    await sendmail(emailEntry[1]);
                }
                catch (error) {
                    var hasError = true;
                    console.log("Error in sending mail:", error.response.data.error.message)
                    await updateStatus(mailrequests, emailEntry[1].ID, 'O', error.response.data.error.message);
                    continue;
                }
                await updateStatus(mailrequests, emailEntry[1].ID, 'C', successMessage);
            } else {
                var hasError = true;
                console.log("Error in sending mail:", blockedMessage)
                await updateStatus(mailrequests, emailEntry[1].ID, 'O', blockedMessage);
            }
        }

        if(hasError === true){
            req.warn({
                code : 201,
                message : apiWarningMessage
            })
        }else{
            req.notify({
                code : 200,
                message : apiSuccessMessage
            })
        }
    })
}