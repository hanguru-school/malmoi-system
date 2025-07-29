import { CognitoUserPool, CognitoUser, AuthenticationDetails, CognitoUserAttribute } from 'amazon-cognito-identity-js';

// Cognito Provider 설정 (도쿄 리전)
export const cognitoProviderConfig = {
  clientId: process.env.COGNITO_CLIENT_ID!,
  clientSecret: process.env.COGNITO_CLIENT_SECRET!,
  issuer: `${process.env.COGNITO_DOMAIN}/${process.env.COGNITO_USER_POOL_ID}`,
  domain: process.env.COGNITO_DOMAIN!,
  userPoolId: process.env.COGNITO_USER_POOL_ID!,
};

// Cognito User Pool 설정 (도쿄 리전)
export const poolData = {
  UserPoolId: cognitoProviderConfig.userPoolId,
  ClientId: cognitoProviderConfig.clientId,
};

// Cognito User Pool 인스턴스
export const userPool = new CognitoUserPool(poolData);

// Cognito 인증 유틸리티 함수들
export const cognitoAuth = {
  // 사용자 로그인
  signIn: (username: string, password: string): Promise<any> => {
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
  },

  // 사용자 등록
  signUp: (username: string, password: string, email: string, attributes: any = {}): Promise<any> => {
    return new Promise((resolve, reject) => {
      const attributeList: CognitoUserAttribute[] = [
        new CognitoUserAttribute({
          Name: 'email',
          Value: email,
        }),
        ...Object.entries(attributes).map(([key, value]) => 
          new CognitoUserAttribute({
            Name: key,
            Value: value as string,
          })
        ),
      ];

      userPool.signUp(username, password, attributeList, [], (err, result) => {
        if (err) {
          reject({
            success: false,
            error: err.message || '회원가입에 실패했습니다.',
          });
        } else {
          resolve({
            success: true,
            user: result?.user,
            message: '회원가입이 완료되었습니다. 이메일을 확인하여 계정을 활성화해주세요.',
          });
        }
      });
    });
  },

  // 현재 사용자 가져오기
  getCurrentUser: (): CognitoUser | null => {
    return userPool.getCurrentUser();
  },

  // 사용자 세션 가져오기
  getSession: (): Promise<any> => {
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
  },

  // 사용자 속성 가져오기
  getUserAttributes: (): Promise<any> => {
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
  },

  // 로그아웃
  signOut: (): void => {
    const cognitoUser = userPool.getCurrentUser();
    if (cognitoUser) {
      cognitoUser.signOut();
    }
  },

  // 비밀번호 변경
  changePassword: (oldPassword: string, newPassword: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      const cognitoUser = userPool.getCurrentUser();
      if (cognitoUser) {
        cognitoUser.changePassword(oldPassword, newPassword, (err: any, result: any) => {
          if (err) {
            reject({
              success: false,
              error: err.message || '비밀번호 변경에 실패했습니다.',
            });
          } else {
            resolve({
              success: true,
              message: '비밀번호가 성공적으로 변경되었습니다.',
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
  },

  // 비밀번호 재설정 요청
  forgotPassword: (username: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({
        Username: username,
        Pool: userPool,
      });

      cognitoUser.forgotPassword({
        onSuccess: () => {
          resolve({
            success: true,
            message: '비밀번호 재설정 이메일이 발송되었습니다.',
          });
        },
        onFailure: (err: any) => {
          reject({
            success: false,
            error: err.message || '비밀번호 재설정 요청에 실패했습니다.',
          });
        },
      });
    });
  },

  // 비밀번호 재설정 확인
  confirmForgotPassword: (username: string, code: string, newPassword: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({
        Username: username,
        Pool: userPool,
      });

      cognitoUser.confirmPassword(code, newPassword, {
        onSuccess: () => {
          resolve({
            success: true,
            message: '비밀번호가 성공적으로 재설정되었습니다.',
          });
        },
        onFailure: (err: any) => {
          reject({
            success: false,
            error: err.message || '비밀번호 재설정에 실패했습니다.',
          });
        },
      });
    });
  },
};

// OAuth URL 생성 (도쿄 리전)
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