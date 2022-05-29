const cdsapi = require('@sapmentors/cds-scp-api');

module.exports = async function (result) {
    console.log("Preparing mail content");
    const mailcontent = {
        message: {
            subject: result.subject,
            body: {
                contentType: 'Text',
                content: result.body
            },
            toRecipients: [
                {
                    emailAddress: {
                        address: result.recipient
                    }
                }
            ],
            from: {
                emailAddress: {
                    address: result.sender
                }
            }
        },
        saveToSentItems: 'false'
    };

    //Add attachment
    console.log("Adding attachments");
    if(result.attachments){
        var objlist = [];
        const attachmententries = result.attachments.entries();

        for (let i of attachmententries) {
            objlist.push({
                '@odata.type': "#microsoft.graph.fileAttachment",
                name: i[1].name,
                contentType: i[1].contentType,
                contentBytes: i[1].contentBytes
            });
        }
        Object.assign(mailcontent.message, { attachments: objlist });
    }

    try {
        console.log("Preparing to send mail");
        const service = await cdsapi.connect.to("Microsoft_Graph_Mail_API");
        await service.run({
            // url: "/v1.0/me/sendmail",
            url: `/v1.0/users/${result.sender}/sendmail`,
            method: "post",
            headers: {
                'content-type': 'application/json'
            },
            data: mailcontent,
        })
        console.log("Mail sent successfully");
        return;
    }

    catch (error) {
        throw new Error(error.message);
    }
}