module.exports = async function (entity) {
    switch (entity.status) {
        case 'C':
            entity.sendHidden = true
            entity.statusCriticality = 3
            break
        case 'O':
            entity.sendHidden = false
            entity.statusCriticality = 1
            break
    }
}