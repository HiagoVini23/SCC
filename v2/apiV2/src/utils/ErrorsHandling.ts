import { TypeErrorsEnum } from "../enum/TypeErrorsEnum"

export function getStatusResponseError(response: any) {
    switch (response.data) {
        case TypeErrorsEnum.Internal:
            return 500
            break
        case TypeErrorsEnum.NotFound:
            return 404
            break
        case TypeErrorsEnum.AlreadyExists:
            return 400
            break
        default:
            return 500
            break
    }
}