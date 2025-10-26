/**
 * 비밀번호 검증 유틸리티
 */

// 비밀번호 정규식: 8자 이상, 대소문자, 숫자, 특수문자 포함
export const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/

export const passwordValidation = {
  regex: passwordRegex,
  message: '비밀번호는 8자 이상, 대문자, 소문자, 숫자, 특수문자를 각각 최소 1개 포함해야 합니다.',
}

export function validatePassword(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('비밀번호는 최소 8자 이상이어야 합니다.')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('영어 소문자를 최소 1개 포함해야 합니다.')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('영어 대문자를 최소 1개 포함해야 합니다.')
  }
  if (!/\d/.test(password)) {
    errors.push('숫자를 최소 1개 포함해야 합니다.')
  }
  if (!/[@$!%*?&]/.test(password)) {
    errors.push('특수문자(@$!%*?&)를 최소 1개 포함해야 합니다.')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * 이름 검증 유틸리티
 */

// 이름 정규식: 영어와 한글만, 단어 사이 단일 공백 허용
export const nameRegex = /^[a-zA-Z가-힣]+(\s[a-zA-Z가-힣]+)*$/

export const nameValidation = {
  regex: nameRegex,
  message: '영어와 한글만 입력 가능하며, 단어 사이 단일 공백만 허용됩니다.',
}

export function validateName(name: string): {
  isValid: boolean
  error: string | null
} {
  if (name.length < 2) {
    return {
      isValid: false,
      error: '이름은 최소 2자 이상이어야 합니다.',
    }
  }

  if (!nameRegex.test(name)) {
    return {
      isValid: false,
      error: nameValidation.message,
    }
  }

  return {
    isValid: true,
    error: null,
  }
}

/**
 * 소속 검증 유틸리티
 */

// 소속 정규식: 영어와 한글만, 단어 사이 단일 공백 허용
export const organizationRegex = /^[a-zA-Z가-힣]+(\s[a-zA-Z가-힣]+)*$/

export const organizationValidation = {
  regex: organizationRegex,
  message: '영어와 한글만 입력 가능하며, 단어 사이 단일 공백만 허용됩니다.',
}

export function validateOrganization(organization: string): {
  isValid: boolean
  error: string | null
} {
  if (organization.length < 2) {
    return {
      isValid: false,
      error: '소속은 최소 2자 이상이어야 합니다.',
    }
  }

  if (!organizationRegex.test(organization)) {
    return {
      isValid: false,
      error: organizationValidation.message,
    }
  }

  return {
    isValid: true,
    error: null,
  }
}

/**
 * 이메일 검증 유틸리티
 */
export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateEmail(email: string): {
  isValid: boolean
  error: string | null
} {
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      error: '올바른 이메일 형식이 아닙니다.',
    }
  }

  return {
    isValid: true,
    error: null,
  }
}
