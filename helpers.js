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

module.exports = getUserByEmail;