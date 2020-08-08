import express from 'express'
import expressGraphql from 'express-graphql'
import { join } from 'path'
import { loadSchemaSync, GraphQLFileLoader, addResolversToSchema } from 'graphql-tools'
import resolvers from './graphql/resolvers'
import { models } from './sequelize'
import pino from 'pino'
import { verify } from 'jsonwebtoken'
import { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET } from './config'
import cookieParser from 'cookie-parser'
import { createTokens } from './auth'

const logger = pino({ prettyPrint: { colorize: true } })
const schema = loadSchemaSync(join(__dirname, './graphql/*.graphql'), { loaders: [new GraphQLFileLoader()] })
const schemaWithResolvers = addResolversToSchema({ schema, resolvers })

const contextMiddleware = (req, res, next) => {
	logger.info('contextMiddleware')
	next()
}

// TODO: COPIAR PROYECTO Y CREAR UNA SESSION CON REDIS PARA LA AUTHENTICATION.
// https://www.youtube.com/watch?v=PNuRpf3p_vA


const app = express()
app.use(cookieParser())

app.use(contextMiddleware)

app.use( async (req, res, next) => {
	const accessToken = req.cookies['access-token']
	const refreshToken = req.cookies['refresh-token']
	
	if (!refreshToken) return next()
	if (!refreshToken && !accessToken) return next()
	
	try {
		const verifyAccess = verify(accessToken, ACCESS_TOKEN_SECRET)
		req.userId = verifyAccess.userId
		return next()
	} catch (e) {
		console.log(`Error access token verify: ${e}`)
	}

	let data 

	try {
		data = verify(refreshToken, REFRESH_TOKEN_SECRET)
	} catch (e) {
		console.log(`Error refresh token verify: ${e}`)
		return next()
	}

	const user = await models.user.findByPk(data.userId)

	if (!user || user.count !== data.count) {
		//token invalidated
		console.log("count different")
		return next()
	}

	const tokens = createTokens(user)
	res.cookie('refresh-token', tokens.refreshToken)
	res.cookie('access-token', tokens.accessToken)
	req.userId = user.id
	
	next()
})

app.get('/', (req, res) => {
	res.send({
		request: 'OK',
		api: '/api',
		playground: '/graphql',
	})
})

app.use('/graphql', (req, res) => {
	expressGraphql({
		schema: schemaWithResolvers,
		rootValue: global,
		graphiql: true,
		context: { models, req, res },
		pretty: true,
	})(req, res)
})
app.listen(4000)
logger.info('Server running on localhost:4000')
