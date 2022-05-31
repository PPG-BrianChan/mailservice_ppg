module.exports = async function (whitelists) {
    console.log("Getting whitelists");
    const query = SELECT.from(whitelists);
    return await cds.run(query)
}