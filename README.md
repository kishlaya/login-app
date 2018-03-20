# Login App

A minimal login/register interface using NodeJS backend

## Stack

* Backend
	* Entire backend stands upon NodeJS
	* Express is used to handle server requests
	* Express-session middleware to save user login sessions
	* Mongoose library for managing connections with MongoDB
	* Bcrypt to encrypt user passwords before saving to database

* Frontend
	* All the web templates are written in pug

## Features

Includes but not limited to

* Google Recaptcha Resolve
* Email Verification
* Password Reset

## Usage

1. `git clone https://github.com/kishlaya/login-app.git`
2. `cd login-app`
3. `npm install`
4. Add required configurations to the config/default.json file
5. Start your mongod server
6. `npm start`