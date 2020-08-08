import { sign } from 'jsonwebtoken'
import {ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET} from './config'


export const createTokens = (user) => {
	// TODO: Create a persistent session with access and refresh token id?
	const accessToken = sign({ userId: user.id }, ACCESS_TOKEN_SECRET, { expiresIn: '15s' })
	const refreshToken = sign({ userId: user.id, count: user.count }, REFRESH_TOKEN_SECRET, {
		expiresIn: '7d',
	})
    
	return {accessToken, refreshToken}
}