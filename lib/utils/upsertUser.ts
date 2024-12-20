import { nanoid } from "nanoid";
import { CtlxClientType } from '../client';

/**
 * Checks for an existing user with the same email or creates a new one if one
 * doesn't exist. Returns User.Id;
 * 
 * @param email User email
 * @param customerName Name to be set for the created User
 * @param client openapi-fetch client
 * @returns User ID
 */
export async function upsertUser(email: string, customerName: string, client: CtlxClientType): Promise<string> {
    // Check if user already exists in Cryptlex Users
    let userId: string | null = null
    const userResponse = await client.GET('/v3/users', {
        params: {
            query: {
                email: { eq: email },
            },
        },
    })

    if (userResponse.error) {
        throw Error(`User search failed: ${userResponse.error.message}.`)
    }

    if (userResponse.data[0]) {
        userId = userResponse.data[0].id
    } else {
        // If user with this email doesn't already exist, create a new one 
        const user = await client.POST('/v3/users', {
            body: {
                email: email,
                firstName: customerName,
                password: nanoid(10),
                role: 'user',
            },
        });

        if (user.error) {
            throw Error(`User creation failed: ${user.error.message}`);
        }
        userId = user.data.id
    }

    return userId;
}