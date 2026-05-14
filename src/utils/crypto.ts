import CryptoJS from 'crypto-js'

const SECRET = 'altabots-assistant-1234567890ab'
const key = CryptoJS.enc.Utf8.parse(SECRET)
const iv = CryptoJS.enc.Utf8.parse(SECRET)

export function aesEncrypt(data: string): string {
  return CryptoJS.AES.encrypt(data, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  }).toString()
}

export function aesDecrypt(encrypted: string): string {
  return CryptoJS.AES.decrypt(encrypted, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  }).toString(CryptoJS.enc.Utf8)
}
