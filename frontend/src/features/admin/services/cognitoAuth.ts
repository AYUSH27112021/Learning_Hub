import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserSession,
} from "amazon-cognito-identity-js";

const pool = new CognitoUserPool({
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID as string,
  ClientId:   import.meta.env.VITE_COGNITO_CLIENT_ID   as string,
});

export type SignInResult =
  | { type: "success"; session: CognitoUserSession }
  | { type: "new_password_required"; user: CognitoUser };

export function cognitoSignIn(email: string, password: string): Promise<SignInResult> {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: pool });
    const auth = new AuthenticationDetails({ Username: email, Password: password });
    user.authenticateUser(auth, {
      onSuccess: (session) => resolve({ type: "success", session }),
      onFailure: reject,
      newPasswordRequired: () => resolve({ type: "new_password_required", user }),
    });
  });
}

export function cognitoCompleteNewPassword(
  user: CognitoUser,
  newPassword: string,
): Promise<CognitoUserSession> {
  return new Promise((resolve, reject) => {
    user.completeNewPasswordChallenge(newPassword, {}, {
      onSuccess: resolve,
      onFailure: reject,
    });
  });
}

export function cognitoForgotPassword(email: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: pool });
    user.forgotPassword({
      onSuccess: () => resolve(),
      onFailure: reject,
    });
  });
}

export function cognitoConfirmForgotPassword(
  email: string,
  code: string,
  newPassword: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: pool });
    user.confirmPassword(code, newPassword, {
      onSuccess: () => resolve(),
      onFailure: reject,
    });
  });
}

export function cognitoSignOut(): void {
  pool.getCurrentUser()?.signOut();
}

export function cognitoGetSession(): Promise<CognitoUserSession | null> {
  return new Promise((resolve) => {
    const user = pool.getCurrentUser();
    if (!user) return resolve(null);
    user.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err || !session?.isValid()) return resolve(null);
      resolve(session);
    });
  });
}

export async function cognitoGetAccessToken(): Promise<string | null> {
  const session = await cognitoGetSession();
  return session?.getAccessToken().getJwtToken() ?? null;
}

export async function cognitoGetEmail(): Promise<string | null> {
  const session = await cognitoGetSession();
  if (!session) return null;
  const payload = session.getIdToken().decodePayload();
  return (payload["email"] as string) ?? null;
}
