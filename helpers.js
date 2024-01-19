const getUserByEmail = function(email, database) {
    for(const user in database){
        if(email == database[user].email){
            //return the user object if found
            return database[user];
        }
    }
    //return false if not found
    return false;
}

const generateRandomString = function() {
    const length = 6;
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
}

const urlsForUser = function(id, database){
    const result = {};
    for(const item in database){
        if(database[item].userID == id){
            result[item] = database[item];
        }
    }
    return result;
}

module.exports = {getUserByEmail, generateRandomString, urlsForUser};