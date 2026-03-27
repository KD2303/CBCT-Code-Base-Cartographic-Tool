# CBCT Integration Contract

## For External Systems & Integration Partners

This document is a formal contract between CBCT and any external system integrating with it.

---

## What CBCT Guarantees to Integrations

### 🔐 API Stability Guarantee (Major Version)

For all CBCT 2.x versions (2.0.0 - 2.999.999):

```javascript
// This EXACT signature will ALWAYS work
window.CBCT.launch({
  repoPath?: string,
  mode?: 'standalone' | 'embedded',
  initialData?: object
})
```

**Guarantee**: You can write code against CBCT 2.0.0 and it will work flawlessly on CBCT 2.50.0

---

### ✅ What Will NOT Change (2.x Lifetime)

| Item | Guarantee | Evidence |
|------|-----------|----------|
| **Function exists** | `window.CBCT.launch` always available | Public API design |
| **Function signature** | Same parameters, same types | No breaking changes policy |
| **Repo path support** | Local paths + GitHub URLs | Core functionality |
| **Mode values** | `'standalone'` + `'embedded'` always work | Documented behavior |
| **Initial data format** | `{ graph, metrics }` structure stable | Data contract |
| **Backward compatibility** | Old code works in new versions | Semantic versioning |

---

### 🆕 What CAN Change (Non-Breaking)

New features that will NOT break your integration:

| Feature | Example | Your Integration Impact |
|---------|---------|------------------------|
| **New optional parameters** | `CBCT.launch({ ..., streaming: true })` | ✓ Ignore if not needed |
| **New modes** | `mode: 'headless'` | ✓ Your mode still works |
| **New public methods** | `CBCT.export('json')` | ✓ Optional to use |
| **New event types** | `CBCT.on('analysis:progress', ...)` | ✓ Use if beneficial |
| **Extended initialData** | New keys in metadata | ✓ Ignore new keys |
| **Performance improvements** | Faster analysis | ✓ Direct benefit |
| **New analysis options** | `CBCT.configure({ ... })` | ✓ Use selectively |

---

### ❌ What Will NEVER Happen (2.x Lifetime)

| ❌ Bad Idea | Why NOT | Alternative |
|------------|---------|-------------|
| Remove `launch()` | Would break all integrations | Will evolve, not remove |
| Change core parameters | Would break existing calls | New optional params only |
| Remove mode values | Would break existing deployments | New modes added instead |
| Change initialData format | Would cause data loading failure | Extend format, don't break |
| Expose internal state | Violates contract | Extra methods if needed |
| Require external dependencies | CBCT must stay independent | Plugins if extensibility needed |

---

## What CBCT Requires from Integrations

### 🚫 You MUST NOT Do This

```javascript
// ❌ NEVER access internal store
import { useStore } from 'cbct/src/store/useStore';
const store = useStore.getState();
store.setRepositoryPath(path); // BAD!

// ❌ NEVER assume component structure
const canvas = document.querySelector('.graph-canvas');
canvas.addEventListener('click', hack); // BAD!

// ❌ NEVER depend on CBCT's private API
window.__CBCT_INTERNAL.analyzer.run(); // BAD!

// ❌ NEVER create reverse dependencies
// CBCT should never need to know about AetherOS, IDE, etc.
```

### ✅ You MUST DO This

```javascript
// ✅ ALWAYS use the public API
window.CBCT.launch({ repoPath, mode, initialData });

// ✅ ALWAYS check for feature availability
if (window.CBCT?.on) {
  CBCT.on('graph:loaded', handler);
}

// ✅ ALWAYS handle missing CBCT gracefully
if (!window.CBCT) {
  console.warn('CBCT not loaded, showing fallback UI');
  showFallback();
}

// ✅ ALWAYS version-check for new features
if (CBCT.version >= '2.1.0' && CBCT.features?.includes('auth')) {
  // Use auth feature
}
```

---

## API Reference (Stable Contract)

### Function: `launch()`

```typescript
interface LaunchConfig {
  /**
   * Repository path to analyze
   * - Local path: '/path/to/repo'
   * - GitHub URL: 'https://github.com/owner/repo'
   * - Optional: omit for welcome screen (standalone mode only)
   */
  repoPath?: string;
  
  /**
   * Launch mode
   * - 'standalone': show welcome screen if no repoPath
   * - 'embedded': hide welcome, auto-start analysis
   * - Default: 'standalone'
   */
  mode?: 'standalone' | 'embedded';
  
  /**
   * Pre-computed graph data
   * - Skip analysis and show cached graph
   * - Format: { graph: {...}, metrics: {...} }
   * - Optional: omit if not available
   */
  initialData?: {
    graph: {
      nodes: Array;
      edges: Array;
      metadata?: object;
    };
    metrics?: {
      complexity?: object;
      centrality?: object;
    };
  };
}

function launch(config: LaunchConfig): void
```

---

## Compatibility Levels

### Level 1: Minimum Integration (Works Now & Forever)
```javascript
// Works in CBCT 2.0.0, 2.1.0, 2.50.0, etc.
window.CBCT.launch({
  repoPath: '/my/repo',
  mode: 'embedded'
})
```
**Compatibility**: 100% guaranteed not to break

---

### Level 2: Optimized Integration (Works Now, Future-Ready)
```javascript
// Includes caching for performance
window.CBCT.launch({
  repoPath: '/my/repo',
  mode: 'embedded',
  initialData: getCachedAnalysis('/my/repo')
})
```
**Compatibility**: 100% guaranteed not to break

---

### Level 3: Advanced Integration (Current + Future Features)
```javascript
// Uses optional features if available
window.CBCT.launch({
  repoPath: '/my/repo',
  mode: 'embedded',
  initialData: getCachedAnalysis('/my/repo'),
  auth: getCurrentUser()?.token  // New optional param (2.1.0+)
})

// Listens to new events if available
if (window.CBCT?.on) {
  window.CBCT.on('graph:loaded', handleGraphLoaded);
}
```
**Compatibility**: Works in 2.0, enhanced in 2.1+, graceful degradation

---

## Version Compatibility Matrix

### Which CBCT Versions Support What?

| Feature | 2.0.0 | 2.1.0 | 2.2.0 | 3.0.0 |
|---------|-------|-------|-------|-------|
| `launch(config)` | ✅ | ✅ | ✅ | ✅ |
| `mode: 'standalone'` | ✅ | ✅ | ✅ | ✅ |
| `mode: 'embedded'` | ✅ | ✅ | ✅ | ✅ |
| `initialData` | ✅ | ✅ | ✅ | ✅ |
| `auth` param | ❌ | ✅ | ✅ | ✅ |
| `CBCT.on()` events | ❌ | ✅ | ✅ | ✅ |
| `CBCT.export()` | ❌ | ❌ | ✅ | ✅ |
| `mode: 'headless'` | ❌ | ❌ | ✅ | ✅ |
| **Breaking changes** | No | No | No | ✅ Major |

---

## Integration Validation Checklist

Use this to ensure your integration is compatible with current AND future CBCT versions.

### Pre-Integration Review

- [ ] I only use `window.CBCT.launch()`
- [ ] I don't import any CBCT source files
- [ ] I don't access `useStore` or internal modules
- [ ] I don't modify CBCT's DOM elements
- [ ] I don't assume CBCT implementation details
- [ ] I check if CBCT is loaded before calling it
- [ ] I've tested with CBCT 2.0.0+

### Code Quality Checks

- [ ] Feature detection for optional capabilities
  ```javascript
  if (window.CBCT?.on) { /* new events */ }
  ```

- [ ] Version compatibility checks
  ```javascript
  if (window.CBCT?.version?.startsWith('2.')) { /* safe */ }
  ```

- [ ] Graceful fallbacks
  ```javascript
  try {
    CBCT.launch(config);
  } catch(e) {
    showFallback();
  }
  ```

- [ ] Error handling
  ```javascript
  if (!window.CBCT) {
    console.warn('CBCT not loaded');
    return;
  }
  ```

### Testing Checklist

- [ ] Test with CBCT 2.0.0 (earliest version)
- [ ] Test with CBCT 2.latest (current version)
- [ ] Test with minimal params: `CBCT.launch({})`
- [ ] Test with full params: `CBCT.launch({...all params...})`
- [ ] Test error scenarios: missing CBCT, bad path, etc.
- [ ] Test with cached data: `initialData` provided
- [ ] Test with fresh analysis: no `initialData`
- [ ] Test mode switching: switch between repos

### Documentation Checklist

- [ ] Document your integration pattern
- [ ] Document CBCT version compatibility
- [ ] Document expected data structure
- [ ] Document error handling approach
- [ ] Document deployment instructions
- [ ] Document rollback procedure

---

## Support & Escalation

### Questions About the Contract?

| Question | Answer Location |
|----------|-----------------|
| How do I use CBCT? | [QUICK_START.md](QUICK_START.md) |
| What's the API reference? | [INTEGRATION_GUIDE.js](INTEGRATION_GUIDE.js) |
| How do I ensure compatibility? | This document |
| What are best practices? | [TECHNICAL_ARCHITECTURE.md](TECHNICAL_ARCHITECTURE.md) |
| How do I extend CBCT? | [FORWARD_COMPATIBILITY_ASSESSMENT.md](FORWARD_COMPATIBILITY_ASSESSMENT.md) |

### Reporting Issues

If you find a compatibility issue:

1. **Verify your code** uses only public API
2. **Document the issue** with minimal reproducible example
3. **Check CBCT version** you're using
4. **Report with**:
   - CBCT version
   - Your integration code
   - Expected vs actual behavior
   - Steps to reproduce

---

## Breaking Change Policy

### When CBCT Goes to 3.0 (or later major version)

You will have:
- **6 months notice**: Announcement + migration guide
- **12 months support**: Both 2.x and 3.x maintained
- **Migration tools**: Scripts/guides to upgrade your integration
- **Open issues**: Able to discuss compatibility concerns

**Your option**: Stay on 2.x if 3.x doesn't fit your needs

---

## Contract Signature

By using CBCT's public API, you agree:

✅ I will use only `window.CBCT`  
✅ I will not access internal modules  
✅ I will handle missing CBCT gracefully  
✅ I will update my integration with new CBCT versions  
✅ I will follow semantic versioning expectations  

CBCT agrees:

✅ 2.x versions will not break the public API  
✅ New features will be backward compatible  
✅ Breaking changes will only happen in major versions  
✅ Documentation will always be maintained  
✅ Version compatibility will be clearly communicated  

---

## Version History

| CBCT Version | Public API Status | Integration Support | Status |
|--------------|------------------|-------------------|--------|
| 2.0.0 | Introduced | Full support | ✅ Current |
| 2.1.0+ | Extended (non-breaking) | Enhanced features | ✅ Planned |
| 3.0.0+ | Breaking changes | New contract | 🔄 Future |

---

## Summary

**This contract ensures**:
- ✅ Your integration works with multiple CBCT versions
- ✅ CBCT can evolve without breaking compatibility
- ✅ New features can be added safely
- ✅ Breaking changes happen only with notice
- ✅ Everyone knows what to expect

**Your responsibility**:
- Use ONLY public API
- Don't assume internals
- Test against target CBCT version
- Plan for major version upgrades

**The result**: Both CBCT and your integration system can grow independently while staying compatible.
