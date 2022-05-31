const wcmatch = require('wildcard-match')

module.exports = async function (whitelists,recipient) {
    if (whitelists != undefined) {
        console.log("Whitelist available, checking recipient");
        const entries = whitelists.entries()
        for (let i of entries) {
            console.log(i[1].addressArea)
            var isMatch = wcmatch(i[1].addressArea)
            if (isMatch(recipient)) return true
        }
    }

    return false
}