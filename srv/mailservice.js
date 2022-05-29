const cds = require('@sap/cds');
const sendmail = require('./libs/sendmail.js');
const updateStatus = require('./libs/updateStatus.js');
const setMailEntityFieldControl = require('./libs/setMailEntityFieldControl.js')

module.exports = (srv) => {

    //After Create -> Send mail and update status
    srv.after(['CREATE'], 'mailrequests', async (result) => {
        const { mailrequests } = srv.entities;
        try {
            await sendmail(result);
        }
        catch (error) {
            console.log("Error in sending mail:", error.message)
            //By default status is O -> No need to update status again 
            // await updateStatus(mailrequests, result.ID, 'O');
            return;
        }
        await updateStatus(mailrequests, result.ID, 'C');
        console.log("Mail request status updated successfully");
    })


    //For failed mails -> Action sendmail
    srv.on('sendmail', async (req) => {
        const { mailrequests } = srv.entities;
        const id = req.params[0].ID;
        console.log("Sending mail manually ID:", id);
        const query_get_req_details = SELECT.one
            .from(mailrequests)
            .where`ID=${id}`;
        const result = await cds.run(query_get_req_details);

        try {
            await sendmail(result);
        }
        catch (error) {
            console.log("Error in sending mail:", error.response.data.error.message)
            req.error(error.response.status, `Error in sending mail:.  ${error.response.data.error.message}`)
            return;
        }
        await updateStatus(mailrequests, result.ID, 'C');
        req.info('Mail request sent and status updated successfully')
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

}