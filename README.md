# ZlcaClient

Một wrapper cho thư viện axios với một số tính năng bổ sung.

## Table of Contents

- Giới thiệu
- API Interfaces
- Các tính năng và ví dụ
- Phụ lục
- Hướng phát triển trong tương lai

### 1. Giới thiệu

ZlcaClient được viết ra nhằm mục đích bổ sung thêm một tính năng cho thư viện axios và tích hợp một số nghiệp vụ cần thiết.
ZlcaClient bao gồm các module chính:

- `AxiosCore`: một wrapper cho thư viện axios được inject thêm logger, decryptor module. AxiosCore được sử dụng nhằm mục đích là một module gọi request với tham số là http request, trả về một raw response (được trả về từ thư viện axios). Logger được sử dụng để log lại request, decryptor được sử dụng để decrypt response trả về.
- `AxiosEngine`: AxiosEngine sẽ sử dụng AxiosCore để thực hiện việc gọi request và nhận về response. Còn AxiosEngine được tạo ra nhằm mục đích wrap thêm các business logic cho AxiosCore (Bởi vì bản thân AxiosCore nó chỉ nhận request và trả về một response). Ví dụ: thực hiện request với các retrySchema như thế nào, chuẩn hóa response, chuẩn hóa lỗi như thế nào, hold một response như thế nào... AxiosEngine sử dụng thêm waitRequestManager để quản lý cái request được hold lại khi bị mất kết nối Internet.
- `ZlcaClient`: ZlcaClient được sử dụng là 'mặt ngoài' cho các dev sử dụng. ZlcaClient sẽ chuẩn bị request, các retrySchema, (nó là nơi đặt các cấu hình mặc định như defaultRetrySchema, requestOptions,...)... để cho AxiosEngine xử lý, "đánh chặn" các request bị block (được quản lý bởi interceptor. Interceptor module được inject vào trong ZlcaClient), tạo trước các REST method cho các dev sử dụng. (_Hiện tại, đang để việc chuẩn hóa response, chuẩn hóa lỗi ở axiosEngine, đang xem xét việc di chuyển các bước này sang cho ZlcaClient trong tương lai_.)

Ngoài ra, nó còn cần thêm một module khác: DetectNetwork để hỗ trợ việc phát hiện kết nối/mất kết nối Internet. (DetectNetwork sẽ được giới thiệu thêm ở phần Phụ lục).

## 2. API Interfaces

### 2.1. ZlcaClient interfaces

ZlcaClient API hiện tại sẽ có các interface về các REST method: `get` , `post`, `put`, `delete`. Ngoài ra sẽ có 2 interface để inject các dependency: `useInterceptor`, `useAxiosEngine`,...Lập trình viên sử dụng các REST method này để thực hiện việc gọi API. (Trong tương lai, sẽ support thêm các tính năng nữa theo yêu cầu của dev).
Các REST method ở trên sẽ sử dụng chung một `Request Schema` để mô tả một request, `url` có thể là absolute hoặc relative (sẽ lấy base url được configure ở trong ZlcaClient).

```js script
ZlcaClient.get(url, requestSchema)
ZlcaClient.post(url, requestSchema)
ZlcaClient.put(url, requestSchema)
ZlcaClient.delete(url, requestSchema)

//For dependency injection:
ZlcaClient.useInterceptor(interceptor)
ZlcaClient.useAxiosEngine(axiosEngine)
```

#### 2.2. Request Schema properties

Trong tương lai, một requestSchema object sẽ hỗ trợ tất cả các property có thể có trong một request (của thư viện axios hỗ trợ). Hiện tại, request schema sẽ support một số property thông dụng của một request object và sẽ có thêm một số property mới để support các chức năng mới.

```js script
requestSchema = {
  //Request configuration.
  requestConfig: {
    headers: {
      'Content-Type': 'application/json',
    }
    params: {
      id: '123',
    },
    //Data được sử dụng cho POST, PUT, DELETE method.
    data: {
      username: 'maitrungdong',
      password: '123',
    },
    timeout: 1000,
    withCredentials: false,
    responseType: 'json',
    maxContentLength: 2000,
    maxBodyLength: 2000,
  },

  //Request có thể được abort hay không?
  isAbortable: true,
  //Request có được hold khi mất kết nối internet hay không?
  shouldHold: true,
  //Khoảng thời gian đợi kết nối Internet nếu như bị mất kết nối Internet (đơn vị ms).
  waitNetworkTime: 60*1000, // ms | 'infinite'
  //Mảng chứa các retrySchema cho một mã lỗi hoặc cho một mảng mã lỗi.
  retrySchemas: [],
}
```

Bởi vì, các dev chỉ sử dụng ZlcaClient nên ta chỉ nêu rõ API interface của ZlcaClient. Các module khác bên ngoài không được sử dụng.

### 3. Các tính năng

#### 3.1. Cancel request

Thay vì phải tạo ra một abortCtrl từ `AbortController interface`, rồi sau đó gán cho một request khi sử dụng thư viện axios. Bây giờ, mỗi khi tạo một request ta chỉ cần set thuộc tính `isAbortable = true` thì ZlcaClient sẽ trả về cho chúng ta một instance có support abort() method để sử dụng. Instance sẽ có kiểu `AbortablePendingRequest`, cụ thể về kiểu dữ liệu này sẽ được nói ở phần Phụ lục.

```js script
const requestSchema = {
  requestConfig: {
    //...
  },
  isAbortable = true,
  //Other settings...
}

const pendingRequest = ZlcaClient.get('/api/messages', requestSchema)
pendingRequest.abort() // Abort before getting response
const res = await pendingRequest
```

#### 3.2. Thực hiện một request với các retrySchema

Để thêm các `retrySchema` cho một request, ta sẽ set up ở thuộc tính `retrySchemas`. Cấu trúc của object `retrySchema` sẽ được đề cập ở phần Phụ lục.

```js script
const retrySchema = {
  maxRetries: 3,
  msBackoff: 1000,
  errorCodes: [404, 400, 500],
}
const requestSchema = {
  requestConfig: {
    //...
  },
  retrySchemas: [retrySchema],
  //Other settings...
}
```

#### 3.3. Hold một request khi mất kết nối trong một khoảng thời gian

Để set up một request với tính năng này thì ta sẽ cần set 2 thuộc tính ở requestSchema đó là: `shouldHold`, `waitNetworkTime`. Thuộc tính `shouldHold`: kiểu boolean. Thuộc tính `waitNetworkTime`: khoảng thời gian chờ đợi kết nối Internet trở lại (đơn vị: ms hoặc 'infinite'), nếu thiết lập waitNetworkTime: 'infinite' thì nó sẽ đợi cho đến khi có mạng trở lại.

```js script
const requestSchema = {
  requestConfig: {
    //...
  },
  shouldHold: true,
  waitNetworkTime: 60 * 60 * 1000, // an hour.
  //Other settings...
}
```

#### 3.4. Chặn/mở chặn một request tới một url trong một khoảng thời gian nhất định

Đây là một tính năng được cài đặt bên trong ZlcaClient module, các dev không cần phải setup trước gì cả. Mỗi khi request được thực hiện, ZlcaClient sẽ sử dụng `Interceptor module` để kiểm tra liệu url trong request này có nằm trong `blackList` (được quản lý bởi `Interceptor`) hay không. Nếu có, nó sẽ quăng lỗi `BlockedUrlError`.
Để thêm một url vào `blackList` trong Interceptor, ta sẽ dựa vào response (từ request trước đó) trả về với `BLOCKED_URL_ERROR_CODE` và `blockTime` được định nghĩa bởi server. Nếu `blockTime` được trả về là number (khoảng thời gian hữu hạn) thì Interceptor sẽ tự động dọn dẹp. Còn nếu `blockTime` trả về là 'infinite' thì Interceptor sẽ lắng nghe event trả về từ server để quyết định có xóa ra khỏi blackList hay không.

### 4. Phụ lục

#### 4.1. Các supporter module

##### 4.1.1. Logger

Logger được sử dụng để ghi log lại các request/response tương ứng ở AxiosCore module. Hiện tại, trong project đang triển khai một sample logger. Ta có thể triển khai logger thật và inject vào AxiosCore.

##### 4.1.2. Decryptor

Decryptor được sử dụng để decrypt response được trả về từ AxiosCore. Hiện tại, trong project đang triển khai một sample decryptor. Ta có thể triển khai decryptor thật và inject vào AxiosCore.

##### 4.1.3. Interceptor

Interceptor được sử dụng để quản lý danh sách các url bị chặn bao gồm: thêm mới, xóa (tự động hoặc dựa vào event), kiểm tra,... cùng với các function hỗ trợ. Interceptor giúp ngăn cho các request tới các url (đang bị chặn) được gửi lên server.

##### 4.1.4. WaitRequestsManager

WaitRequestsManager được sử dụng để quản lý danh sách các request được thực hiện trong quá trình mất kết nối Internet bao gồm: thêm mới, xóa (tự động), kiểm tra,... cùng với các function hỗ trợ. WaitRequestsManager giúp lưu giữ lại các request khi mất kết nối Internet (bằng cách không trả về response cho người dùng mà sẽ await cho đến khi nào có mạng trở lại hoặc hết thời gian chờ).

##### 4.1.5. DetectNetwork

DetectNetwork được viết ra nhằm mục đích khắc phục các hạn chế của các native api ('online', 'offline' , 'change') khi nhận biết việc có kết nối Internet hay không. Nó hoạt động dựa trên cơ chế: Ping tới các server "ổn định" trong một khoảng thời gian để detect kết nối Internet. Nó sẽ được gắn `global` trên window. Các dev có thể sử dụng bằng cách lắng nghe các sự kiện:

```js script
window.ZlcaClient.addEvenListener('online', onlineListener)
window.ZlcaClient.addEventListener('offline', offlineListener)
window.ZlcaClient.addEventListener('change', (status)=> {
  if(status === 'online'){
    console.log('Network is online')
  }
  if(status === 'offline'){
    console.log('Network is offline)
  }
})
```

#### 4.2. Các kiểu dữ liệu mới

##### 4.2.1. AbortablePendingRequest

AbortablePendingRequest là một thenable object được sử dụng để tạo một request có thể abort.

##### 4.2.2. Deferer

Deferer là một object được sử dụng để tạo một cơ chế delay và có thể cancel việc delay bất cứ lúc nào.

Ngoài ra, còn một số kiểu dữ liệu mới khác sẽ cập nhật vào sau.

### 5. Hướng phát triển trong tương lai

- Xây dựng thêm các tính năng mới cho ZlcaClient theo yêu cầu.
- Custom lại AxiosCore để bỏ qua việc sử dụng thư viện axios.
- Xem xét lại việc chuẩn hóa response và error cho phù hợp với dự án thực tế (ZAPC) hơn.
  Hiện tại, đang dựa ra response trả về từ BE của chat application demo.
- Fix lỗi nếu có.
