import userQueries from '../user/queries'
import userMutations from '../user/mutations'
import userResolvers from '../user/resolvers'

const resolvers = {
	Query: {
		me: async (_, __, { req, models }) => {
			if (!req.userId) {
				return null	
			}

			const response = await models.user.findByPk(req.userId)
			return response

			
		},
		...userQueries,
	},
	Mutation: {
		...userMutations,
	},
	User: { ...userResolvers }, // Create a custom resolver.
}

export default resolvers
