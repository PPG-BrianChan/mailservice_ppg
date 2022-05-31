const cdsapi = require('@sapmentors/cds-scp-api');

module.exports = async function (data,) {
    console.log("Preparing mail content");
    const mailcontent = {
        message: {
            subject: data.subject,
            body: {
                contentType: 'Text',
                content: data.body
            },
            toRecipients: [
                {
                    emailAddress: {
                        address: data.recipient
                    }
                }
            ],
            from: {
                emailAddress: {
                    address: data.sender
                }
            }
        },
        saveToSentItems: 'false'
    };

    //Add attachment
    console.log("Adding attachments");
    if (data.attachments) {
        var objlist = [];
        const attachmententries = data.attachments.entries();

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

    console.log("Preparing to send mail");
    const service = await cdsapi.connect.to("Microsoft_Graph_Mail_API");
    return await service.run({
        url: `/v1.0/users/${data.sender}/sendmail`,
        method: "post",
        headers: {
            'content-type': 'application/json'
        },
        data: mailcontent,
    })
}