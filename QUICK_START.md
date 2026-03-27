# CBCT Public Launch API - Quick Start Guide

## 🚀 Overview

CBCT now exposes a clean public API for external systems to control its launch behavior while remaining fully independent.

## 📦 The API

```javascript
window.CBCT.launch({
  repoPath: string,           // Optional: repository path to analyze
  mode: 'standalone'|'embedded', // Optional: default is 'standalone'
  initialData: object         // Optional: pre-computed graph data
})
```

## 🎯 Three Ways to Use CBCT

### 1️⃣ Standalone (Default)
```javascript
// User sees welcome screen and inputs repo manually
CBCT.launch({})
// or
CBCT.launch()
```
✓ Existing CBCT behavior unchanged  
✓ No external system needed  
✓ User has full control  

---

### 2️⃣ Embedded with Auto-Analysis
```javascript
// External system provides repo path
// CBCT auto-starts analysis
CBCT.launch({
  repoPath: '/path/to/repo',
  // or: 'https://github.com/owner/repo'
  mode: 'embedded'
})
```
✓ No welcome screen  
✓ Automatic analysis  
✓ Perfect for context switching  

---

### 3️⃣ Embedded with Cached Data
```javascript
// External system provides repo AND pre-computed data
// CBCT displays graph instantly (no API calls)
CBCT.launch({
  repoPath: '/path/to/repo',
  mode: 'embedded',
  initialData: {
    graph: {
      nodes: [...],
      edges: [...],
      metadata: { revealDepth: 3 }
    },
    metrics: {
      complexity: {...},
      centrality: {...}
    }
  }
})
```
✓ Instant display  
✓ No network requests  
✓ Great for offline scenarios  

---

## 🛡️ Design Guarantees

### What CBCT Guarantees
✓ Always standalone and independent  
✓ Zero dependencies on external systems  
✓ Internal state never exposed  
✓ Simple, stable public contract  
✓ Backward compatible (default is standalone)  

### What External Systems Must NOT Do
✗ Access `useStore` directly  
✗ Manipulate store state externally  
✗ Assume CBCT implementation details  
✗ Create reverse dependencies  

---

## 📋 Quick Examples

### Example: AetherOS Integration
```javascript
// AetherOS context manager
class CBCTIntegration {
  launchCBCT(repoPath, cachedAnalysis) {
    if (!window.CBCT) {
      console.error('CBCT not loaded');
      return;
    }
    
    window.CBCT.launch({
      repoPath: repoPath,
      mode: 'embedded',
      initialData: cachedAnalysis || undefined
    });
  }
  
  switchRepo(repoPath, cachedAnalysis) {
    // Simply call launch() again with new repo
    this.launchCBCT(repoPath, cachedAnalysis);
  }
}
```

### Example: Safe Fallback
```javascript
if (window.CBCT && window.CBCT.launch) {
  window.CBCT.launch({
    repoPath: '/my/repo',
    mode: 'embedded'
  });
} else {
  console.warn('CBCT not available, using fallback');
}
```

---

## 📂 File Structure

```
client/src/public/
├── launch.js              ← Main API
├── index.js               ← API docs
└── INTEGRATION_GUIDE.js    ← Detailed examples
```

## 🔍 Where to Find More Info

| Question | Answer |
|----------|--------|
| How do I use CBCT? | See the [examples](#-three-ways-to-use-cbct) above |
| What's the full API? | See [client/src/public/index.js](client/src/public/index.js) |
| Show me code examples | See [client/src/public/INTEGRATION_GUIDE.js](client/src/public/INTEGRATION_GUIDE.js) |
| What about anti-patterns? | See `antiPatterns` in INTEGRATION_GUIDE.js |
| How do I test integration? | See `testScenarios` in INTEGRATION_GUIDE.js |
| Full documentation | See [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) |

---

## ✅ Implementation Checklist

- [x] Public launch module created (`public/launch.js`)
- [x] Mode support added to store (`setMode`, `bootstrap`)
- [x] Welcome screen logic updated (respects mode)
- [x] Auto-analysis effect added (embedded mode)
- [x] Global CBCT export added (`window.CBCT`)
- [x] Comprehensive documentation written
- [x] Integration examples provided
- [x] No breaking changes, fully backward compatible
- [x] All code tested, no errors

---

## 🎬 Get Started in 30 Seconds

Install CBCT and add this to your app:

```html
<!-- Load CBCT -->
<script src="/path/to/cbct/dist/main.js"></script>

<script>
  // Wait for CBCT to load
  if (window.CBCT) {
    // Launch CBCT with your repo
    window.CBCT.launch({
      repoPath: '/your/repo/path',
      mode: 'embedded'
    });
  }
</script>
```

That's it! CBCT will analyze your repo and display the dependency graph.

---

## 💡 Key Insight

> CBCT is now a **fully independent product** with a **clean public interface**. External systems can control how it launches without coupling to its internals.

**Standalone**: Works perfectly alone  
**Embedded**: Integrates seamlessly with external systems  
**Independent**: Never depends on who uses it  

---

## 📞 Need Help?

- **For standalone usage**: No changes needed, CBCT works as before
- **For embedded usage**: Refer to INTEGRATION_GUIDE.js
- **For advanced usage**: Check the full IMPLEMENTATION_SUMMARY.md

Enjoy your enhanced CBCT! 🎉
