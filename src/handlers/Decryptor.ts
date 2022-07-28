import { AxiosResponse } from 'axios'
import { IDecryptor } from '../declares/interfaces'

class Decryptor implements IDecryptor {
  decrypt(rawResponse: AxiosResponse) {
    let decryptedRes: AxiosResponse
    //TODO: process rawResponse to decrypted response
    console.log('>>>DECRYPTOR: running...')
    decryptedRes = rawResponse
    console.log(decryptedRes)
    console.log('>>>DECRYPTOR: ended...')

    return decryptedRes
  }
}

export default Decryptor
