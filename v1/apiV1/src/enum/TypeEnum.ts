export enum TypeErrorsEnum {
    AlreadyExists = "ALREADY_EXISTS",
    NotFound = "NOT_FOUND",
    Internal = "INTERNAL"
}

export enum TypeCapability {
    SelfAllowed = "SELF_FOUND_ALLOWED",
    SelfViolated = "SELF_FOUND_VIOLATED",
    ExternViolated = "EXTERNALLY_FOUND_VIOLATED"
}