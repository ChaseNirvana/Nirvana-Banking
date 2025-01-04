'use server';

import { ID } from "node-appwrite";
import { createAdminClient, createSessionClient } from "../appwrite";
import { cookies } from "next/headers";
import { parseStringify } from "../utils";

export const signIn = async ({ email, password }: signInProps) => {
  try {
    const { account } = await createAdminClient();
    const session = await account.createEmailPasswordSession(email, password);

    // Set cookie
    (await cookies()).set("appwrite-session", session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: true,
    });

    return session;
  } catch (error) {
    console.error("Error during sign-in:", error);
    throw error;
  }
};


export const signUp = async (userData: SignUpParams) => {
const { email, password, firstName, lastName } = userData;

    try {
        const { account } = await createAdminClient();

        const newUserAccount = await account.create(
            ID.unique(), 
            email, 
            password, 
            `${firstName} ${lastName}`
        );
        
        const session = await account.createEmailPasswordSession(email, password);
      
        (await cookies()).set("appwrite-session", session.secret, {
          path: "/",
          httpOnly: true,
          sameSite: "strict",
          secure: true,
        });

        return parseStringify(newUserAccount);
    } catch (error) {
        console.error('Error', error);
    }
}

export async function getLoggedInUser() {
  try {
    const sessionClient = await createSessionClient();

    if (!sessionClient) {
      return null; // Return null if no session client
    }

    const user = await sessionClient.account.get();
    return user;
  } catch (error) {
    console.error("Error fetching logged-in user:", error);
    return null; // Return null if fetching user fails
  }
}


  
export const logoutAccount = async () => {
  try {
    // Delete the session cookie first
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("appwrite-session");

    if (!sessionCookie || !sessionCookie.value) {
      cookieStore.delete("appwrite-session");
      return true; // Still consider logout successful as the cookie is cleared
    }

    // Then delete the Appwrite session
    const { account } = await createSessionClient();

    if (account) {
      await account.deleteSession("current");
    }

    // Clear the session cookie
    cookieStore.delete("appwrite-session");

    return true; // Logout successful
  } catch (error) {
    console.error("Error during logout:", error);
    return false;
  }
};
