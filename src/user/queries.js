import * as bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import {createTokens} from '../auth'
import { authenticateToken } from '../index'

module.exports = {
	getUsers: async (_, { token }, { models }) => {
		try {
			const users = await models.user.findAll()
			return users
		} catch (e) {
			console.log(`Error: ${e}, `)
			throw e
		}
	},
	getUserById: async (_, { id }, { models }) => {
		try {
			const users = await models.user.findByPk(id)
			return users
		} catch (e) {
			console.log(`Error: ${e}`)
			throw e
		}
	},
	userLogin: async (_, { input }, { models, res }) => {
		try {
			const user = await models.user.findOne({
				where: { email: input.email },
			})
			if (!user) {
				return { message: 'Please check your credentials' }
			}
			const valid = await bcrypt.compare(input.password, user.password)
			if (!valid) {
				return { message: 'Please check your credentials' }
			}

			const {accessToken, refreshToken} = createTokens(user)

			res.cookie('refresh-token', refreshToken)
			res.cookie('access-token', accessToken)

			return {
				accessToken,
				refreshToken,
				message: 'User logged in successfully',
				user,
			}
		} catch (e) {
			console.log(e)
		}
	},
}
