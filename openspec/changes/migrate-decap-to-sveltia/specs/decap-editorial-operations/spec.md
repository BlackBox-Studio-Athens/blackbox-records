## REMOVED Requirements

### Requirement: Decap remains the editorial content surface

**Reason**: The Decap capability is retired when Sveltia becomes the only CMS runtime.
**Migration**: Use `sveltia-editorial-operations` requirement `Sveltia remains the editorial content surface`.

### Requirement: Decap publishes directly to main

**Reason**: Publishing moves from Decap to Sveltia.
**Migration**: Use `sveltia-editorial-operations` requirement `Publishing consequences are explicit`.

### Requirement: Decap build mode is explicit

**Reason**: Decap proxy and DecapBridge modes are removed.
**Migration**: Use `sveltia-editorial-operations` requirement `CMS access mode is explicit`.

### Requirement: Hosted authentication stays non-technical

**Reason**: Shared Google/DecapBridge authentication is replaced by GitHub OAuth through one designated GitHub account.
**Migration**: Use `sveltia-editorial-operations` requirement `Hosted authentication uses one designated GitHub identity`.

### Requirement: Collection navigation prioritizes routine work

**Reason**: The collection behavior moves with the replacement CMS capability.
**Migration**: Use `sveltia-editorial-operations` requirement `Collection controls match stored and rendered content`.

### Requirement: CMS controls match stored and rendered content

**Reason**: The content contract moves with the replacement CMS capability.
**Migration**: Use `sveltia-editorial-operations` requirement `Collection controls match stored and rendered content`.

### Requirement: Fixed-layout page sections cannot be structurally corrupted

**Reason**: The fixed-layout contract moves with the replacement CMS capability.
**Migration**: Use `sveltia-editorial-operations` requirement `Collection controls match stored and rendered content`.

### Requirement: Fields provide editor-facing validation

**Reason**: Field validation moves to supported Sveltia controls.
**Migration**: Use `sveltia-editorial-operations` requirement `Native controls protect content validity and stable identity`.

### Requirement: Stable content identities are protected from CMS deletion

**Reason**: Identity and deletion behavior moves with the replacement CMS capability.
**Migration**: Use `sveltia-editorial-operations` requirement `Native controls protect content validity and stable identity`.

### Requirement: CMS media paths form one safe contract

**Reason**: Media behavior moves to Sveltia's native asset and preview APIs.
**Migration**: Use `sveltia-editorial-operations` requirement `Media and previews use Sveltia-native paths`.

### Requirement: Key public previews reflect the current site

**Reason**: Preview outcomes move from Decap registration to supported Sveltia registration.
**Migration**: Use `sveltia-editorial-operations` requirement `Media and previews use Sveltia-native paths`.

### Requirement: Decap runtime versions and custom patches are controlled

**Reason**: The Decap runtime and compatibility patches are removed.
**Migration**: Use `sveltia-editorial-operations` requirement `Runtime integration stays small and controlled`.

### Requirement: Ready state removes the boot surface

**Reason**: The Decap boot state machine is removed instead of migrated.
**Migration**: Use `sveltia-editorial-operations` requirement `Runtime integration stays small and controlled`.

### Requirement: Routine Store Item and Release workflows are task-first

**Reason**: Routine task behavior moves with the replacement CMS capability.
**Migration**: Use `sveltia-editorial-operations` requirement `Routine workflows remain task-first and accessible`.

### Requirement: Artist slugs are generated without editor input

**Reason**: Artist slug behavior moves to the Sveltia pre-save integration.
**Migration**: Use `sveltia-editorial-operations` requirement `Native controls protect content validity and stable identity`.

### Requirement: Admin branding and controls remain legible

**Reason**: Admin presentation moves with the replacement CMS capability.
**Migration**: Use `sveltia-editorial-operations` requirement `Routine workflows remain task-first and accessible`.

### Requirement: Decap supports mobile editorial work

**Reason**: Mobile behavior moves with the replacement CMS capability.
**Migration**: Use `sveltia-editorial-operations` requirement `Routine workflows remain task-first and accessible`.

### Requirement: Decap configuration uses current native options

**Reason**: Decap configuration and extension APIs are removed.
**Migration**: Use the Sveltia content and runtime requirements in `sveltia-editorial-operations`.
