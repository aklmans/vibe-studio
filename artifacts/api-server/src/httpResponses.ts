export function notFoundResponse() {
  return {
    error: {
      message: "Not found",
    },
  } as const;
}

export function internalServerErrorResponse() {
  return {
    error: {
      message: "Internal server error",
    },
  } as const;
}
