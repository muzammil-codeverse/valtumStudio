# RBAC matrix

The executable authority is `src/modules/auth/policies/authorization.ts`; this page is a
review aid, not a second policy implementation.

| Resource family                       | Owner                                  | Admin                          | Editor                                  |
| ------------------------------------- | -------------------------------------- | ------------------------------ | --------------------------------------- |
| Dashboard and published/draft content | Full management                        | Full management                | Read/create/update drafts only          |
| Leads                                 | Read/update/manage                     | Read/update/manage             | Denied                                  |
| Site settings and navigation          | Read/update/manage                     | Read/update                    | Settings denied; navigation drafts only |
| Users and security events             | Read/create/update/manage; read events | Denied                         | Denied                                  |
| Sessions                              | Read/revoke/manage                     | Read/revoke own sessions       | Read/revoke own sessions                |
| Audit/system                          | Read/manage                            | Audit read only; system denied | Denied                                  |

No role can impersonate or delete a user. Permission checks occur on the server after
completed authentication; UI visibility is not an authorization decision.
