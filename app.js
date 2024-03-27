const express = require('express')
const path = require('path')
const sqlite3 = require('sqlite3')
const {open} = require('sqlite')
const bcrypt = require('bcrypt')
const dbpath = path.join(__dirname, 'userData.db')
const app = express()
const cors = require('cors')
app.use(cors())
app.use(express.json())
let db = null
const initialize = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is start!!!')
    })
  } catch (e) {
    console.log(`Error message ${e.message}`)
    process.exit(1)
  }
}
initialize()

app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const createUserQuery = `select * from user where username = '${username}';`
  const hashedpassword = await bcrypt.hash(password, 10)
  const dbuser = await db.get(createUserQuery)
  if (dbuser === undefined) {
    if (password.length < 5) {
      response.status(400)
      response.send('Password is too short')
    } else {
      const userQuery = `insert into user (username,name,password,gender,location)
                        values(
                            '${username}',
                            '${name}',
                            '${hashedpassword}',
                            '${gender}',
                            '${location}'
                        );`
      await db.run(userQuery)
      response.status(200)
      response.send('User created successfully')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const selectUserQuery = `select * from user where username = '${username}';`
  const dbuser = await db.get(selectUserQuery)
  if (dbuser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordmatched = await bcrypt.compare(password, dbuser.password)
    if (isPasswordmatched === true) {
      response.status(200)
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const selectUserQuery = `select * from user where username ='${username}';`
  const dbuser = await db.get(selectUserQuery)

  if (dbuser === undefined) {
    response.status(400)
    response.send('User not Regeister')
  } else {
    const isValidPassword = await bcrypt.compare(oldPassword, dbuser.password)
    if (isValidPassword === true) {
      if (newPassword.length < 5) {
        response.status(400)
        response.send('Password is too short')
      } else {
        const hasPassword = await bcrypt.hash(newPassword, 10)
        const updatePassword = `update user set password = '${hasPassword}' where username ='${username}';`
        await db.run(updatePassword)
        response.status(200)
        response.send('Password updated')
      }
    } else {
      response.status(400)
      response.send('Invalid current password')
    }
  }
})

module.exports = app
