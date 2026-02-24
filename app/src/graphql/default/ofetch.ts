// This file is auto-generated once by nitro-graphql for quick start
// You can modify this file according to your needs
import type { Requester } from '#graphql/default/sdk'
import { getSdk } from '#graphql/default/sdk'

export function createGraphQLClient(endpoint: string): Requester {
  return async <R>(doc: string, vars?: any): Promise<R> => {
    const result = await fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify({ query: doc, variables: vars }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    return result.json() as Promise<R>
  }
}

export const $sdk = getSdk(createGraphQLClient('/api/graphql'))
