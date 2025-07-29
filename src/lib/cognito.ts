import { CognitoUserPool, CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js';
import { cognitoProviderConfig, poolData } from './cognito-provider';

// Cognito User Pool 인스턴스 (기존 호환성을 위해 유지)
export const userPool = new CognitoUserPool(poolData);

// 개별 함수들 export
export const signIn = (username: string, password: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const authenticationDetails = new AuthenticationDetails({
      Username: username,
      Password: password,
    });

    const cognitoUser = new CognitoUser({
      Username: username,
      Pool: userPool,
    });

    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (result) => {
        resolve({
          success: true,
          accessToken: result.getAccessToken().getJwtToken(),
          idToken: result.getIdToken().getJwtToken(),
          refreshToken: result.getRefreshToken().getToken(),
        });
      },
      onFailure: (err) => {
        reject({
          success: false,
          error: err.message || '로그인에 실패했습니다.',
        });
      },
    });
  });
};

export const getCurrentUser = (): CognitoUser | null => {
  return userPool.getCurrentUser();
};

export const getSession = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    const cognitoUser = userPool.getCurrentUser();
    if (cognitoUser) {
      cognitoUser.getSession((err: any, session: any) => {
        if (err) {
          reject({
            success: false,
            error: err.message || '세션을 가져오는데 실패했습니다.',
          });
        } else if (session.isValid()) {
          resolve({
            success: true,
            session,
            accessToken: session.getAccessToken().getJwtToken(),
            idToken: session.getIdToken().getJwtToken(),
          });
        } else {
          reject({
            success: false,
            error: '세션이 유효하지 않습니다.',
          });
        }
      });
    } else {
      reject({
        success: false,
        error: '로그인된 사용자가 없습니다.',
      });
    }
  });
};

export const getUserAttributes = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    const cognitoUser = userPool.getCurrentUser();
    if (cognitoUser) {
      cognitoUser.getUserAttributes((err: any, attributes: any) => {
        if (err) {
          reject({
            success: false,
            error: err.message || '사용자 속성을 가져오는데 실패했습니다.',
          });
        } else {
          const userAttributes: any = {};
          attributes?.forEach((attr: any) => {
            userAttributes[attr.getName()] = attr.getValue();
          });
          resolve({
            success: true,
            attributes: userAttributes,
          });
        }
      });
    } else {
      reject({
        success: false,
        error: '로그인된 사용자가 없습니다.',
      });
    }
  });
};

export const signOut = (): void => {
  const cognitoUser = userPool.getCurrentUser();
  if (cognitoUser) {
    cognitoUser.signOut();
  }
};

// 기존 함수들 (호환성을 위해 유지)
export const cognitoAuth = {
  signIn,
  getCurrentUser,
  getSession,
  getUserAttributes,
  signOut,
};

// OAuth URL 생성 (새로운 설정 사용)
export const createOAuthUrl = (redirectUri: string, state?: string): string => {
  const url = new URL(`${cognitoProviderConfig.domain}/oauth2/authorize`);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', cognitoProviderConfig.clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('scope', 'email openid phone');
  if (state) {
    url.searchParams.set('state', state);
  }
  return url.toString();
};

// 토큰 교환 (Authorization Code를 Access Token으로)
export const exchangeCodeForToken = async (code: string, redirectUri: string): Promise<any> => {
  const tokenUrl = `${cognitoProviderConfig.domain}/oauth2/token`;
  
  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('client_id', cognitoProviderConfig.clientId);
  params.append('code', code);
  params.append('redirect_uri', redirectUri);

  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.statusText}`);
    }

    const tokenData = await response.json();
    return {
      success: true,
      accessToken: tokenData.access_token,
      idToken: tokenData.id_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || '토큰 교환에 실패했습니다.',
    };
  }
};

export default cognitoAuth; 