module.exports = async function (attachments,parent_id) {
    let query = SELECT.from(attachments).where({ parent_ID: parent_id })
    let result = await cds.run(query)
    if (result) {
        var attachmentList = []

        if (!Array.isArray(result)) {
            attachmentList.push(result)
        }
        else attachmentList = result

        return attachmentList
    } else return null
}