import { IDecryptor } from '../declares/interfaces'

class Decryptor implements IDecryptor {
  decrypt(rawResponse) {
    let decryptedRes = null
    //TODO: process rawResponse to decrypted response
    console.log('>>>DECRYPTOR: running...')
    decryptedRes = rawResponse
    console.log(decryptedRes)
    console.log('>>>DECRYPTOR: ended...')

    return decryptedRes
  }
}

const decryptor = new Decryptor()
export default decryptor
