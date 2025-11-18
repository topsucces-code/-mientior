
# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** mientior
- **Date:** 2025-11-13
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

#### Test TC001
- **Test Name:** Homepage Load and Element Visibility
- **Test Code:** [TC001_Homepage_Load_and_Element_Visibility.py](./TC001_Homepage_Load_and_Element_Visibility.py)
- **Test Error:** Testing stopped due to critical issue: category navigation links lead to 404 error pages. Homepage loads and hero carousel work, but navigation is broken. Please fix the category links to proceed with further testing.
Browser Console Logs:
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-collection.jpg&w=1280&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-category.jpg&w=384&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fimages%2Fplaceholder.jpg&w=256&q=75:0:0)
[WARNING] Pusher environment variables not configured. Real-time notifications disabled. (at webpack-internal:///(app-pages-browser)/./src/components/header/notifications-dropdown.tsx:43:24)
[ERROR] React does not recognize the `%s` prop on a DOM element. If you intentionally want it to appear in the DOM as a custom attribute, spell it as lowercase `%s` instead. If you accidentally passed it from a parent component, remove it from the DOM element. originalPrice originalprice (at webpack-internal:///(app-pages-browser)/./node_modules/next/dist/next-devtools/userspace/app/errors/intercept-console-error.js:56:31)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-collection.jpg&w=1280&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-category.jpg&w=384&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fimages%2Fplaceholder.jpg&w=256&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 404 (Not Found) (at http://localhost:3000/categories/electronique?_rsc=amn7r:0:0)
[ERROR] Failed to load resource: the server responded with a status of 404 (Not Found) (at http://localhost:3000/categories/electronique:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/156b829b-9a8a-44ee-b876-1736c158544e/3c9e1103-3c8b-4151-9a9e-bd372e59d065
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC002
- **Test Name:** Product Catalog Filtering and Pagination
- **Test Code:** [TC002_Product_Catalog_Filtering_and_Pagination.py](./TC002_Product_Catalog_Filtering_and_Pagination.py)
- **Test Error:** 
Browser Console Logs:
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-collection.jpg&w=1280&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-category.jpg&w=384&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fimages%2Fplaceholder.jpg&w=256&q=75:0:0)
[ERROR] A tree hydrated but some attributes of the server rendered HTML didn't match the client properties. This won't be patched up. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't match the server.
- External changing data without sending a snapshot of it along with the HTML.
- Invalid HTML tag nesting.

It can also happen if the client has a browser extension installed which messes with the HTML before React loaded.

%s%s https://react.dev/link/hydration-mismatch 

  ...
    <RedirectErrorBoundary router={{...}}>
      <InnerLayoutRouter url="/" tree={[...]} cacheNode={{lazyData:null, ...}} segmentPath={[...]}>
        <SegmentViewNode type="layout" pagePath="(app)/layo...">
          <SegmentTrieNode>
          <AppLayout>
            <div className="flex min-h...">
              ...
                <header className="fixed left...">
                  <PromotionalBanner>
                  <TopBar>
                  <MainHeader>
                    <div className={"bg-white..."} style={{height:"72px"}}>
                      <div className="container ...">
                        <div className="flex items...">
                          <div>
                          <div className="hidden md:...">
                            <AdvancedSearchBar>
                              <form onSubmit={function handleSearch} className="relative f...">
                                <div className="relative">
                                  <Search>
                                  <input
                                    ref={{current:null}}
                                    type="text"
                                    value=""
                                    onChange={function onChange}
                                    onFocus={function onFocus}
                                    placeholder="Rechercher des produits, marques ou catégories..."
                                    className="w-full h-12 pl-12 pr-32 rounded-full border-2 border-gray-200 focus:bor..."
-                                   style={{caret-color:"transparent"}}
                                  >
                                  ...
                          ...
                  ...
              <main>
              <Footer>
                <footer className="bg-gradien...">
                  <NewsletterSubscription className="border-b b...">
                    <section ref={{current:null}} className="relative o...">
                      <div>
                      <div>
                      <div className="container ...">
                        <div className="mx-auto ma...">
                          <div>
                          <div className="" style={{...}}>
                            <form onSubmit={function handleSubmit} className="space-y-4">
                              <div className="flex flex-...">
                                <div className="relative f...">
                                  <Mail>
                                  <_c type="email" placeholder="votre@emai..." value="" onChange={function onChange} ...>
                                    <input
                                      type="email"
                                      className="flex w-full border-input px-3 py-2 ring-offset-background file:border..."
                                      ref={null}
                                      placeholder="votre@email.com"
                                      value=""
                                      onChange={function onChange}
                                      disabled={false}
                                      aria-invalid={false}
                                      aria-describedby={undefined}
-                                     style={{caret-color:"transparent"}}
                                    >
                                ...
                              <label className="flex curso...">
                                <input
                                  type="checkbox"
                                  checked={false}
                                  onChange={function onChange}
                                  disabled={false}
                                  className="mt-0.5 h-5 w-5 flex-shrink-0 cursor-pointer rounded border-2 border-white..."
-                                 style={{caret-color:"transparent"}}
                                >
                                ...
                            ...
                  ...
              ...
      ...
 (at webpack-internal:///(app-pages-browser)/./node_modules/next/dist/next-devtools/userspace/app/errors/intercept-console-error.js:56:31)
[WARNING] Pusher environment variables not configured. Real-time notifications disabled. (at webpack-internal:///(app-pages-browser)/./src/components/header/notifications-dropdown.tsx:43:24)
[ERROR] React does not recognize the `%s` prop on a DOM element. If you intentionally want it to appear in the DOM as a custom attribute, spell it as lowercase `%s` instead. If you accidentally passed it from a parent component, remove it from the DOM element. originalPrice originalprice (at webpack-internal:///(app-pages-browser)/./node_modules/next/dist/next-devtools/userspace/app/errors/intercept-console-error.js:56:31)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-category.jpg&w=384&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fimages%2Fplaceholder.jpg&w=256&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 429 () (at https://ipapi.co/json/:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-collection.jpg&w=1280&q=75:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/156b829b-9a8a-44ee-b876-1736c158544e/c780e026-7b8a-4d1a-8b05-f6afe53a3d34
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC003
- **Test Name:** Product Detail View and Variant Selection
- **Test Code:** [TC003_Product_Detail_View_and_Variant_Selection.py](./TC003_Product_Detail_View_and_Variant_Selection.py)
- **Test Error:** 
Browser Console Logs:
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-collection.jpg&w=1280&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-category.jpg&w=384&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fimages%2Fplaceholder.jpg&w=256&q=75:0:0)
[ERROR] A tree hydrated but some attributes of the server rendered HTML didn't match the client properties. This won't be patched up. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't match the server.
- External changing data without sending a snapshot of it along with the HTML.
- Invalid HTML tag nesting.

It can also happen if the client has a browser extension installed which messes with the HTML before React loaded.

%s%s https://react.dev/link/hydration-mismatch 

  ...
    <RedirectErrorBoundary router={{...}}>
      <InnerLayoutRouter url="/" tree={[...]} cacheNode={{lazyData:null, ...}} segmentPath={[...]}>
        <SegmentViewNode type="layout" pagePath="(app)/layo...">
          <SegmentTrieNode>
          <AppLayout>
            <div className="flex min-h...">
              ...
                <header className="fixed left...">
                  <PromotionalBanner>
                  <TopBar>
                  <MainHeader>
                    <div className={"bg-white..."} style={{height:"72px"}}>
                      <div className="container ...">
                        <div className="flex items...">
                          <div>
                          <div className="hidden md:...">
                            <AdvancedSearchBar>
                              <form onSubmit={function handleSearch} className="relative f...">
                                <div className="relative">
                                  <Search>
                                  <input
                                    ref={{current:null}}
                                    type="text"
                                    value=""
                                    onChange={function onChange}
                                    onFocus={function onFocus}
                                    placeholder="Rechercher des produits, marques ou catégories..."
                                    className="w-full h-12 pl-12 pr-32 rounded-full border-2 border-gray-200 focus:bor..."
-                                   style={{caret-color:"transparent"}}
                                  >
                                  ...
                          ...
                  ...
              <main>
              <Footer>
                <footer className="bg-gradien...">
                  <NewsletterSubscription className="border-b b...">
                    <section ref={{current:null}} className="relative o...">
                      <div>
                      <div>
                      <div className="container ...">
                        <div className="mx-auto ma...">
                          <div>
                          <div className="" style={{...}}>
                            <form onSubmit={function handleSubmit} className="space-y-4">
                              <div className="flex flex-...">
                                <div className="relative f...">
                                  <Mail>
                                  <_c type="email" placeholder="votre@emai..." value="" onChange={function onChange} ...>
                                    <input
                                      type="email"
                                      className="flex w-full border-input px-3 py-2 ring-offset-background file:border..."
                                      ref={null}
                                      placeholder="votre@email.com"
                                      value=""
                                      onChange={function onChange}
                                      disabled={false}
                                      aria-invalid={false}
                                      aria-describedby={undefined}
-                                     style={{caret-color:"transparent"}}
                                    >
                                ...
                              <label className="flex curso...">
                                <input
                                  type="checkbox"
                                  checked={false}
                                  onChange={function onChange}
                                  disabled={false}
                                  className="mt-0.5 h-5 w-5 flex-shrink-0 cursor-pointer rounded border-2 border-white..."
-                                 style={{caret-color:"transparent"}}
                                >
                                ...
                            ...
                  ...
              ...
      ...
 (at webpack-internal:///(app-pages-browser)/./node_modules/next/dist/next-devtools/userspace/app/errors/intercept-console-error.js:56:31)
[WARNING] Pusher environment variables not configured. Real-time notifications disabled. (at webpack-internal:///(app-pages-browser)/./src/components/header/notifications-dropdown.tsx:43:24)
[ERROR] React does not recognize the `%s` prop on a DOM element. If you intentionally want it to appear in the DOM as a custom attribute, spell it as lowercase `%s` instead. If you accidentally passed it from a parent component, remove it from the DOM element. originalPrice originalprice (at webpack-internal:///(app-pages-browser)/./node_modules/next/dist/next-devtools/userspace/app/errors/intercept-console-error.js:56:31)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-category.jpg&w=384&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fimages%2Fplaceholder.jpg&w=256&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-collection.jpg&w=1280&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 429 () (at https://ipapi.co/json/:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/156b829b-9a8a-44ee-b876-1736c158544e/8fdd8648-0ee9-4a18-b00a-518045a45e7b
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC004
- **Test Name:** User Registration and Login with Better Auth
- **Test Code:** [TC004_User_Registration_and_Login_with_Better_Auth.py](./TC004_User_Registration_and_Login_with_Better_Auth.py)
- **Test Error:** 
Browser Console Logs:
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-collection.jpg&w=1280&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-category.jpg&w=384&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fimages%2Fplaceholder.jpg&w=256&q=75:0:0)
[ERROR] A tree hydrated but some attributes of the server rendered HTML didn't match the client properties. This won't be patched up. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't match the server.
- External changing data without sending a snapshot of it along with the HTML.
- Invalid HTML tag nesting.

It can also happen if the client has a browser extension installed which messes with the HTML before React loaded.

%s%s https://react.dev/link/hydration-mismatch 

  ...
    <RedirectErrorBoundary router={{...}}>
      <InnerLayoutRouter url="/" tree={[...]} cacheNode={{lazyData:null, ...}} segmentPath={[...]}>
        <SegmentViewNode type="layout" pagePath="(app)/layo...">
          <SegmentTrieNode>
          <AppLayout>
            <div className="flex min-h...">
              ...
                <header className="fixed left...">
                  <PromotionalBanner>
                  <TopBar>
                  <MainHeader>
                    <div className={"bg-white..."} style={{height:"72px"}}>
                      <div className="container ...">
                        <div className="flex items...">
                          <div>
                          <div className="hidden md:...">
                            <AdvancedSearchBar>
                              <form onSubmit={function handleSearch} className="relative f...">
                                <div className="relative">
                                  <Search>
                                  <input
                                    ref={{current:null}}
                                    type="text"
                                    value=""
                                    onChange={function onChange}
                                    onFocus={function onFocus}
                                    placeholder="Rechercher des produits, marques ou catégories..."
                                    className="w-full h-12 pl-12 pr-32 rounded-full border-2 border-gray-200 focus:bor..."
-                                   style={{caret-color:"transparent"}}
                                  >
                                  ...
                          ...
                  ...
              <main>
              <Footer>
                <footer className="bg-gradien...">
                  <NewsletterSubscription className="border-b b...">
                    <section ref={{current:null}} className="relative o...">
                      <div>
                      <div>
                      <div className="container ...">
                        <div className="mx-auto ma...">
                          <div>
                          <div className="" style={{...}}>
                            <form onSubmit={function handleSubmit} className="space-y-4">
                              <div className="flex flex-...">
                                <div className="relative f...">
                                  <Mail>
                                  <_c type="email" placeholder="votre@emai..." value="" onChange={function onChange} ...>
                                    <input
                                      type="email"
                                      className="flex w-full border-input px-3 py-2 ring-offset-background file:border..."
                                      ref={null}
                                      placeholder="votre@email.com"
                                      value=""
                                      onChange={function onChange}
                                      disabled={false}
                                      aria-invalid={false}
                                      aria-describedby={undefined}
-                                     style={{caret-color:"transparent"}}
                                    >
                                ...
                              <label className="flex curso...">
                                <input
                                  type="checkbox"
                                  checked={false}
                                  onChange={function onChange}
                                  disabled={false}
                                  className="mt-0.5 h-5 w-5 flex-shrink-0 cursor-pointer rounded border-2 border-white..."
-                                 style={{caret-color:"transparent"}}
                                >
                                ...
                            ...
                  ...
              ...
      ...
 (at webpack-internal:///(app-pages-browser)/./node_modules/next/dist/next-devtools/userspace/app/errors/intercept-console-error.js:56:31)
[WARNING] Pusher environment variables not configured. Real-time notifications disabled. (at webpack-internal:///(app-pages-browser)/./src/components/header/notifications-dropdown.tsx:43:24)
[ERROR] React does not recognize the `%s` prop on a DOM element. If you intentionally want it to appear in the DOM as a custom attribute, spell it as lowercase `%s` instead. If you accidentally passed it from a parent component, remove it from the DOM element. originalPrice originalprice (at webpack-internal:///(app-pages-browser)/./node_modules/next/dist/next-devtools/userspace/app/errors/intercept-console-error.js:56:31)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-category.jpg&w=384&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fimages%2Fplaceholder.jpg&w=256&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-collection.jpg&w=1280&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 429 () (at https://ipapi.co/json/:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/156b829b-9a8a-44ee-b876-1736c158544e/9f68c055-d559-4fab-b276-818d24c12321
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC005
- **Test Name:** Add to Cart, Update Quantity, and Remove Items
- **Test Code:** [TC005_Add_to_Cart_Update_Quantity_and_Remove_Items.py](./TC005_Add_to_Cart_Update_Quantity_and_Remove_Items.py)
- **Test Error:** 
Browser Console Logs:
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-collection.jpg&w=1280&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-category.jpg&w=384&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fimages%2Fplaceholder.jpg&w=256&q=75:0:0)
[ERROR] A tree hydrated but some attributes of the server rendered HTML didn't match the client properties. This won't be patched up. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't match the server.
- External changing data without sending a snapshot of it along with the HTML.
- Invalid HTML tag nesting.

It can also happen if the client has a browser extension installed which messes with the HTML before React loaded.

%s%s https://react.dev/link/hydration-mismatch 

  ...
    <RedirectErrorBoundary router={{...}}>
      <InnerLayoutRouter url="/" tree={[...]} cacheNode={{lazyData:null, ...}} segmentPath={[...]}>
        <SegmentViewNode type="layout" pagePath="(app)/layo...">
          <SegmentTrieNode>
          <AppLayout>
            <div className="flex min-h...">
              ...
                <header className="fixed left...">
                  <PromotionalBanner>
                  <TopBar>
                  <MainHeader>
                    <div className={"bg-white..."} style={{height:"72px"}}>
                      <div className="container ...">
                        <div className="flex items...">
                          <div>
                          <div className="hidden md:...">
                            <AdvancedSearchBar>
                              <form onSubmit={function handleSearch} className="relative f...">
                                <div className="relative">
                                  <Search>
                                  <input
                                    ref={{current:null}}
                                    type="text"
                                    value=""
                                    onChange={function onChange}
                                    onFocus={function onFocus}
                                    placeholder="Rechercher des produits, marques ou catégories..."
                                    className="w-full h-12 pl-12 pr-32 rounded-full border-2 border-gray-200 focus:bor..."
-                                   style={{caret-color:"transparent"}}
                                  >
                                  ...
                          ...
                  ...
              <main>
              <Footer>
                <footer className="bg-gradien...">
                  <NewsletterSubscription className="border-b b...">
                    <section ref={{current:null}} className="relative o...">
                      <div>
                      <div>
                      <div className="container ...">
                        <div className="mx-auto ma...">
                          <div>
                          <div className="" style={{...}}>
                            <form onSubmit={function handleSubmit} className="space-y-4">
                              <div className="flex flex-...">
                                <div className="relative f...">
                                  <Mail>
                                  <_c type="email" placeholder="votre@emai..." value="" onChange={function onChange} ...>
                                    <input
                                      type="email"
                                      className="flex w-full border-input px-3 py-2 ring-offset-background file:border..."
                                      ref={null}
                                      placeholder="votre@email.com"
                                      value=""
                                      onChange={function onChange}
                                      disabled={false}
                                      aria-invalid={false}
                                      aria-describedby={undefined}
-                                     style={{caret-color:"transparent"}}
                                    >
                                ...
                              <label className="flex curso...">
                                <input
                                  type="checkbox"
                                  checked={false}
                                  onChange={function onChange}
                                  disabled={false}
                                  className="mt-0.5 h-5 w-5 flex-shrink-0 cursor-pointer rounded border-2 border-white..."
-                                 style={{caret-color:"transparent"}}
                                >
                                ...
                            ...
                  ...
              ...
      ...
 (at webpack-internal:///(app-pages-browser)/./node_modules/next/dist/next-devtools/userspace/app/errors/intercept-console-error.js:56:31)
[WARNING] Pusher environment variables not configured. Real-time notifications disabled. (at webpack-internal:///(app-pages-browser)/./src/components/header/notifications-dropdown.tsx:43:24)
[ERROR] React does not recognize the `%s` prop on a DOM element. If you intentionally want it to appear in the DOM as a custom attribute, spell it as lowercase `%s` instead. If you accidentally passed it from a parent component, remove it from the DOM element. originalPrice originalprice (at webpack-internal:///(app-pages-browser)/./node_modules/next/dist/next-devtools/userspace/app/errors/intercept-console-error.js:56:31)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-category.jpg&w=384&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 429 () (at https://ipapi.co/json/:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fimages%2Fplaceholder.jpg&w=256&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-collection.jpg&w=1280&q=75:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/156b829b-9a8a-44ee-b876-1736c158544e/49d35899-5879-4338-a65d-3f35f22d990e
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC006
- **Test Name:** Multi-step Checkout Flow with Stripe Payment
- **Test Code:** [TC006_Multi_step_Checkout_Flow_with_Stripe_Payment.py](./TC006_Multi_step_Checkout_Flow_with_Stripe_Payment.py)
- **Test Error:** 
Browser Console Logs:
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-collection.jpg&w=1280&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-category.jpg&w=384&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fimages%2Fplaceholder.jpg&w=256&q=75:0:0)
[ERROR] A tree hydrated but some attributes of the server rendered HTML didn't match the client properties. This won't be patched up. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't match the server.
- External changing data without sending a snapshot of it along with the HTML.
- Invalid HTML tag nesting.

It can also happen if the client has a browser extension installed which messes with the HTML before React loaded.

%s%s https://react.dev/link/hydration-mismatch 

  ...
    <RedirectErrorBoundary router={{...}}>
      <InnerLayoutRouter url="/" tree={[...]} cacheNode={{lazyData:null, ...}} segmentPath={[...]}>
        <SegmentViewNode type="layout" pagePath="(app)/layo...">
          <SegmentTrieNode>
          <AppLayout>
            <div className="flex min-h...">
              ...
                <header className="fixed left...">
                  <PromotionalBanner>
                  <TopBar>
                  <MainHeader>
                    <div className={"bg-white..."} style={{height:"72px"}}>
                      <div className="container ...">
                        <div className="flex items...">
                          <div>
                          <div className="hidden md:...">
                            <AdvancedSearchBar>
                              <form onSubmit={function handleSearch} className="relative f...">
                                <div className="relative">
                                  <Search>
                                  <input
                                    ref={{current:null}}
                                    type="text"
                                    value=""
                                    onChange={function onChange}
                                    onFocus={function onFocus}
                                    placeholder="Rechercher des produits, marques ou catégories..."
                                    className="w-full h-12 pl-12 pr-32 rounded-full border-2 border-gray-200 focus:bor..."
-                                   style={{caret-color:"transparent"}}
                                  >
                                  ...
                          ...
                  ...
              <main>
              <Footer>
                <footer className="bg-gradien...">
                  <NewsletterSubscription className="border-b b...">
                    <section ref={{current:null}} className="relative o...">
                      <div>
                      <div>
                      <div className="container ...">
                        <div className="mx-auto ma...">
                          <div>
                          <div className="" style={{...}}>
                            <form onSubmit={function handleSubmit} className="space-y-4">
                              <div className="flex flex-...">
                                <div className="relative f...">
                                  <Mail>
                                  <_c type="email" placeholder="votre@emai..." value="" onChange={function onChange} ...>
                                    <input
                                      type="email"
                                      className="flex w-full border-input px-3 py-2 ring-offset-background file:border..."
                                      ref={null}
                                      placeholder="votre@email.com"
                                      value=""
                                      onChange={function onChange}
                                      disabled={false}
                                      aria-invalid={false}
                                      aria-describedby={undefined}
-                                     style={{caret-color:"transparent"}}
                                    >
                                ...
                              <label className="flex curso...">
                                <input
                                  type="checkbox"
                                  checked={false}
                                  onChange={function onChange}
                                  disabled={false}
                                  className="mt-0.5 h-5 w-5 flex-shrink-0 cursor-pointer rounded border-2 border-white..."
-                                 style={{caret-color:"transparent"}}
                                >
                                ...
                            ...
                  ...
              ...
      ...
 (at webpack-internal:///(app-pages-browser)/./node_modules/next/dist/next-devtools/userspace/app/errors/intercept-console-error.js:56:31)
[WARNING] Pusher environment variables not configured. Real-time notifications disabled. (at webpack-internal:///(app-pages-browser)/./src/components/header/notifications-dropdown.tsx:43:24)
[ERROR] React does not recognize the `%s` prop on a DOM element. If you intentionally want it to appear in the DOM as a custom attribute, spell it as lowercase `%s` instead. If you accidentally passed it from a parent component, remove it from the DOM element. originalPrice originalprice (at webpack-internal:///(app-pages-browser)/./node_modules/next/dist/next-devtools/userspace/app/errors/intercept-console-error.js:56:31)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-category.jpg&w=384&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fimages%2Fplaceholder.jpg&w=256&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-collection.jpg&w=1280&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 429 () (at https://ipapi.co/json/:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/156b829b-9a8a-44ee-b876-1736c158544e/08dc2cf8-907b-4a5f-8211-e210d00f8e3b
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC007
- **Test Name:** User Account Dashboard Management
- **Test Code:** [TC007_User_Account_Dashboard_Management.py](./TC007_User_Account_Dashboard_Management.py)
- **Test Error:** 
Browser Console Logs:
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-collection.jpg&w=1280&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-category.jpg&w=384&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fimages%2Fplaceholder.jpg&w=256&q=75:0:0)
[ERROR] A tree hydrated but some attributes of the server rendered HTML didn't match the client properties. This won't be patched up. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't match the server.
- External changing data without sending a snapshot of it along with the HTML.
- Invalid HTML tag nesting.

It can also happen if the client has a browser extension installed which messes with the HTML before React loaded.

%s%s https://react.dev/link/hydration-mismatch 

  ...
    <RedirectErrorBoundary router={{...}}>
      <InnerLayoutRouter url="/" tree={[...]} cacheNode={{lazyData:null, ...}} segmentPath={[...]}>
        <SegmentViewNode type="layout" pagePath="(app)/layo...">
          <SegmentTrieNode>
          <AppLayout>
            <div className="flex min-h...">
              ...
                <header className="fixed left...">
                  <PromotionalBanner>
                  <TopBar>
                  <MainHeader>
                    <div className={"bg-white..."} style={{height:"72px"}}>
                      <div className="container ...">
                        <div className="flex items...">
                          <div>
                          <div className="hidden md:...">
                            <AdvancedSearchBar>
                              <form onSubmit={function handleSearch} className="relative f...">
                                <div className="relative">
                                  <Search>
                                  <input
                                    ref={{current:null}}
                                    type="text"
                                    value=""
                                    onChange={function onChange}
                                    onFocus={function onFocus}
                                    placeholder="Rechercher des produits, marques ou catégories..."
                                    className="w-full h-12 pl-12 pr-32 rounded-full border-2 border-gray-200 focus:bor..."
-                                   style={{caret-color:"transparent"}}
                                  >
                                  ...
                          ...
                  ...
              <main>
              <Footer>
                <footer className="bg-gradien...">
                  <NewsletterSubscription className="border-b b...">
                    <section ref={{current:null}} className="relative o...">
                      <div>
                      <div>
                      <div className="container ...">
                        <div className="mx-auto ma...">
                          <div>
                          <div className="" style={{...}}>
                            <form onSubmit={function handleSubmit} className="space-y-4">
                              <div className="flex flex-...">
                                <div className="relative f...">
                                  <Mail>
                                  <_c type="email" placeholder="votre@emai..." value="" onChange={function onChange} ...>
                                    <input
                                      type="email"
                                      className="flex w-full border-input px-3 py-2 ring-offset-background file:border..."
                                      ref={null}
                                      placeholder="votre@email.com"
                                      value=""
                                      onChange={function onChange}
                                      disabled={false}
                                      aria-invalid={false}
                                      aria-describedby={undefined}
-                                     style={{caret-color:"transparent"}}
                                    >
                                ...
                              <label className="flex curso...">
                                <input
                                  type="checkbox"
                                  checked={false}
                                  onChange={function onChange}
                                  disabled={false}
                                  className="mt-0.5 h-5 w-5 flex-shrink-0 cursor-pointer rounded border-2 border-white..."
-                                 style={{caret-color:"transparent"}}
                                >
                                ...
                            ...
                  ...
              ...
      ...
 (at webpack-internal:///(app-pages-browser)/./node_modules/next/dist/next-devtools/userspace/app/errors/intercept-console-error.js:56:31)
[WARNING] Pusher environment variables not configured. Real-time notifications disabled. (at webpack-internal:///(app-pages-browser)/./src/components/header/notifications-dropdown.tsx:43:24)
[ERROR] React does not recognize the `%s` prop on a DOM element. If you intentionally want it to appear in the DOM as a custom attribute, spell it as lowercase `%s` instead. If you accidentally passed it from a parent component, remove it from the DOM element. originalPrice originalprice (at webpack-internal:///(app-pages-browser)/./node_modules/next/dist/next-devtools/userspace/app/errors/intercept-console-error.js:56:31)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-category.jpg&w=384&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fimages%2Fplaceholder.jpg&w=256&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-collection.jpg&w=1280&q=75:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/156b829b-9a8a-44ee-b876-1736c158544e/0c2e6040-4657-47bc-ab2d-39c3a46cfea8
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC008
- **Test Name:** Global Search with Autocomplete and Multi-tab Results
- **Test Code:** [TC008_Global_Search_with_Autocomplete_and_Multi_tab_Results.py](./TC008_Global_Search_with_Autocomplete_and_Multi_tab_Results.py)
- **Test Error:** 
Browser Console Logs:
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-collection.jpg&w=1280&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-category.jpg&w=384&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fimages%2Fplaceholder.jpg&w=256&q=75:0:0)
[ERROR] A tree hydrated but some attributes of the server rendered HTML didn't match the client properties. This won't be patched up. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't match the server.
- External changing data without sending a snapshot of it along with the HTML.
- Invalid HTML tag nesting.

It can also happen if the client has a browser extension installed which messes with the HTML before React loaded.

%s%s https://react.dev/link/hydration-mismatch 

  ...
    <RedirectErrorBoundary router={{...}}>
      <InnerLayoutRouter url="/" tree={[...]} cacheNode={{lazyData:null, ...}} segmentPath={[...]}>
        <SegmentViewNode type="layout" pagePath="(app)/layo...">
          <SegmentTrieNode>
          <AppLayout>
            <div className="flex min-h...">
              ...
                <header className="fixed left...">
                  <PromotionalBanner>
                  <TopBar>
                  <MainHeader>
                    <div className={"bg-white..."} style={{height:"72px"}}>
                      <div className="container ...">
                        <div className="flex items...">
                          <div>
                          <div className="hidden md:...">
                            <AdvancedSearchBar>
                              <form onSubmit={function handleSearch} className="relative f...">
                                <div className="relative">
                                  <Search>
                                  <input
                                    ref={{current:null}}
                                    type="text"
                                    value=""
                                    onChange={function onChange}
                                    onFocus={function onFocus}
                                    placeholder="Rechercher des produits, marques ou catégories..."
                                    className="w-full h-12 pl-12 pr-32 rounded-full border-2 border-gray-200 focus:bor..."
-                                   style={{caret-color:"transparent"}}
                                  >
                                  ...
                          ...
                  ...
              <main>
              <Footer>
                <footer className="bg-gradien...">
                  <NewsletterSubscription className="border-b b...">
                    <section ref={{current:null}} className="relative o...">
                      <div>
                      <div>
                      <div className="container ...">
                        <div className="mx-auto ma...">
                          <div>
                          <div className="" style={{...}}>
                            <form onSubmit={function handleSubmit} className="space-y-4">
                              <div className="flex flex-...">
                                <div className="relative f...">
                                  <Mail>
                                  <_c type="email" placeholder="votre@emai..." value="" onChange={function onChange} ...>
                                    <input
                                      type="email"
                                      className="flex w-full border-input px-3 py-2 ring-offset-background file:border..."
                                      ref={null}
                                      placeholder="votre@email.com"
                                      value=""
                                      onChange={function onChange}
                                      disabled={false}
                                      aria-invalid={false}
                                      aria-describedby={undefined}
-                                     style={{caret-color:"transparent"}}
                                    >
                                ...
                              <label className="flex curso...">
                                <input
                                  type="checkbox"
                                  checked={false}
                                  onChange={function onChange}
                                  disabled={false}
                                  className="mt-0.5 h-5 w-5 flex-shrink-0 cursor-pointer rounded border-2 border-white..."
-                                 style={{caret-color:"transparent"}}
                                >
                                ...
                            ...
                  ...
              ...
      ...
 (at webpack-internal:///(app-pages-browser)/./node_modules/next/dist/next-devtools/userspace/app/errors/intercept-console-error.js:56:31)
[WARNING] Pusher environment variables not configured. Real-time notifications disabled. (at webpack-internal:///(app-pages-browser)/./src/components/header/notifications-dropdown.tsx:43:24)
[ERROR] React does not recognize the `%s` prop on a DOM element. If you intentionally want it to appear in the DOM as a custom attribute, spell it as lowercase `%s` instead. If you accidentally passed it from a parent component, remove it from the DOM element. originalPrice originalprice (at webpack-internal:///(app-pages-browser)/./node_modules/next/dist/next-devtools/userspace/app/errors/intercept-console-error.js:56:31)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-category.jpg&w=384&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fimages%2Fplaceholder.jpg&w=256&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-collection.jpg&w=1280&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 429 () (at https://ipapi.co/json/:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/156b829b-9a8a-44ee-b876-1736c158544e/35849b7e-f43a-47f8-9404-b6e4f6cb21e7
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC009
- **Test Name:** Admin Panel Product CRUD and Role-based Access
- **Test Code:** [TC009_Admin_Panel_Product_CRUD_and_Role_based_Access.py](./TC009_Admin_Panel_Product_CRUD_and_Role_based_Access.py)
- **Test Error:** 
Browser Console Logs:
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-collection.jpg&w=1280&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-category.jpg&w=384&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fimages%2Fplaceholder.jpg&w=256&q=75:0:0)
[ERROR] A tree hydrated but some attributes of the server rendered HTML didn't match the client properties. This won't be patched up. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't match the server.
- External changing data without sending a snapshot of it along with the HTML.
- Invalid HTML tag nesting.

It can also happen if the client has a browser extension installed which messes with the HTML before React loaded.

%s%s https://react.dev/link/hydration-mismatch 

  ...
    <RedirectErrorBoundary router={{...}}>
      <InnerLayoutRouter url="/" tree={[...]} cacheNode={{lazyData:null, ...}} segmentPath={[...]}>
        <SegmentViewNode type="layout" pagePath="(app)/layo...">
          <SegmentTrieNode>
          <AppLayout>
            <div className="flex min-h...">
              ...
                <header className="fixed left...">
                  <PromotionalBanner>
                  <TopBar>
                  <MainHeader>
                    <div className={"bg-white..."} style={{height:"72px"}}>
                      <div className="container ...">
                        <div className="flex items...">
                          <div>
                          <div className="hidden md:...">
                            <AdvancedSearchBar>
                              <form onSubmit={function handleSearch} className="relative f...">
                                <div className="relative">
                                  <Search>
                                  <input
                                    ref={{current:null}}
                                    type="text"
                                    value=""
                                    onChange={function onChange}
                                    onFocus={function onFocus}
                                    placeholder="Rechercher des produits, marques ou catégories..."
                                    className="w-full h-12 pl-12 pr-32 rounded-full border-2 border-gray-200 focus:bor..."
-                                   style={{caret-color:"transparent"}}
                                  >
                                  ...
                          ...
                  ...
              <main>
              <Footer>
                <footer className="bg-gradien...">
                  <NewsletterSubscription className="border-b b...">
                    <section ref={{current:null}} className="relative o...">
                      <div>
                      <div>
                      <div className="container ...">
                        <div className="mx-auto ma...">
                          <div>
                          <div className="" style={{...}}>
                            <form onSubmit={function handleSubmit} className="space-y-4">
                              <div className="flex flex-...">
                                <div className="relative f...">
                                  <Mail>
                                  <_c type="email" placeholder="votre@emai..." value="" onChange={function onChange} ...>
                                    <input
                                      type="email"
                                      className="flex w-full border-input px-3 py-2 ring-offset-background file:border..."
                                      ref={null}
                                      placeholder="votre@email.com"
                                      value=""
                                      onChange={function onChange}
                                      disabled={false}
                                      aria-invalid={false}
                                      aria-describedby={undefined}
-                                     style={{caret-color:"transparent"}}
                                    >
                                ...
                              <label className="flex curso...">
                                <input
                                  type="checkbox"
                                  checked={false}
                                  onChange={function onChange}
                                  disabled={false}
                                  className="mt-0.5 h-5 w-5 flex-shrink-0 cursor-pointer rounded border-2 border-white..."
-                                 style={{caret-color:"transparent"}}
                                >
                                ...
                            ...
                  ...
              ...
      ...
 (at webpack-internal:///(app-pages-browser)/./node_modules/next/dist/next-devtools/userspace/app/errors/intercept-console-error.js:56:31)
[WARNING] Pusher environment variables not configured. Real-time notifications disabled. (at webpack-internal:///(app-pages-browser)/./src/components/header/notifications-dropdown.tsx:43:24)
[ERROR] React does not recognize the `%s` prop on a DOM element. If you intentionally want it to appear in the DOM as a custom attribute, spell it as lowercase `%s` instead. If you accidentally passed it from a parent component, remove it from the DOM element. originalPrice originalprice (at webpack-internal:///(app-pages-browser)/./node_modules/next/dist/next-devtools/userspace/app/errors/intercept-console-error.js:56:31)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-category.jpg&w=384&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fimages%2Fplaceholder.jpg&w=256&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-collection.jpg&w=1280&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 429 () (at https://ipapi.co/json/:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/156b829b-9a8a-44ee-b876-1736c158544e/d9ddefa6-857e-41d9-ba1b-68702b245d8a
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC010
- **Test Name:** Cache Invalidation and ISR Revalidation on Data Changes
- **Test Code:** [TC010_Cache_Invalidation_and_ISR_Revalidation_on_Data_Changes.py](./TC010_Cache_Invalidation_and_ISR_Revalidation_on_Data_Changes.py)
- **Test Error:** 
Browser Console Logs:
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-collection.jpg&w=1280&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-category.jpg&w=384&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fimages%2Fplaceholder.jpg&w=256&q=75:0:0)
[ERROR] A tree hydrated but some attributes of the server rendered HTML didn't match the client properties. This won't be patched up. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't match the server.
- External changing data without sending a snapshot of it along with the HTML.
- Invalid HTML tag nesting.

It can also happen if the client has a browser extension installed which messes with the HTML before React loaded.

%s%s https://react.dev/link/hydration-mismatch 

  ...
    <RedirectErrorBoundary router={{...}}>
      <InnerLayoutRouter url="/" tree={[...]} cacheNode={{lazyData:null, ...}} segmentPath={[...]}>
        <SegmentViewNode type="layout" pagePath="(app)/layo...">
          <SegmentTrieNode>
          <AppLayout>
            <div className="flex min-h...">
              ...
                <header className="fixed left...">
                  <PromotionalBanner>
                  <TopBar>
                  <MainHeader>
                    <div className={"bg-white..."} style={{height:"72px"}}>
                      <div className="container ...">
                        <div className="flex items...">
                          <div>
                          <div className="hidden md:...">
                            <AdvancedSearchBar>
                              <form onSubmit={function handleSearch} className="relative f...">
                                <div className="relative">
                                  <Search>
                                  <input
                                    ref={{current:null}}
                                    type="text"
                                    value=""
                                    onChange={function onChange}
                                    onFocus={function onFocus}
                                    placeholder="Rechercher des produits, marques ou catégories..."
                                    className="w-full h-12 pl-12 pr-32 rounded-full border-2 border-gray-200 focus:bor..."
-                                   style={{caret-color:"transparent"}}
                                  >
                                  ...
                          ...
                  ...
              <main>
              <Footer>
                <footer className="bg-gradien...">
                  <NewsletterSubscription className="border-b b...">
                    <section ref={{current:null}} className="relative o...">
                      <div>
                      <div>
                      <div className="container ...">
                        <div className="mx-auto ma...">
                          <div>
                          <div className="" style={{...}}>
                            <form onSubmit={function handleSubmit} className="space-y-4">
                              <div className="flex flex-...">
                                <div className="relative f...">
                                  <Mail>
                                  <_c type="email" placeholder="votre@emai..." value="" onChange={function onChange} ...>
                                    <input
                                      type="email"
                                      className="flex w-full border-input px-3 py-2 ring-offset-background file:border..."
                                      ref={null}
                                      placeholder="votre@email.com"
                                      value=""
                                      onChange={function onChange}
                                      disabled={false}
                                      aria-invalid={false}
                                      aria-describedby={undefined}
-                                     style={{caret-color:"transparent"}}
                                    >
                                ...
                              <label className="flex curso...">
                                <input
                                  type="checkbox"
                                  checked={false}
                                  onChange={function onChange}
                                  disabled={false}
                                  className="mt-0.5 h-5 w-5 flex-shrink-0 cursor-pointer rounded border-2 border-white..."
-                                 style={{caret-color:"transparent"}}
                                >
                                ...
                            ...
                  ...
              ...
      ...
 (at webpack-internal:///(app-pages-browser)/./node_modules/next/dist/next-devtools/userspace/app/errors/intercept-console-error.js:56:31)
[WARNING] Pusher environment variables not configured. Real-time notifications disabled. (at webpack-internal:///(app-pages-browser)/./src/components/header/notifications-dropdown.tsx:43:24)
[ERROR] React does not recognize the `%s` prop on a DOM element. If you intentionally want it to appear in the DOM as a custom attribute, spell it as lowercase `%s` instead. If you accidentally passed it from a parent component, remove it from the DOM element. originalPrice originalprice (at webpack-internal:///(app-pages-browser)/./node_modules/next/dist/next-devtools/userspace/app/errors/intercept-console-error.js:56:31)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-category.jpg&w=384&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fimages%2Fplaceholder.jpg&w=256&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-collection.jpg&w=1280&q=75:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/156b829b-9a8a-44ee-b876-1736c158544e/88c7893f-8210-43d6-93d5-5d44de35f8d9
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC011
- **Test Name:** Promo Codes Application and Validation
- **Test Code:** [TC011_Promo_Codes_Application_and_Validation.py](./TC011_Promo_Codes_Application_and_Validation.py)
- **Test Error:** 
Browser Console Logs:
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-collection.jpg&w=1280&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fimages%2Fplaceholder.jpg&w=256&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-category.jpg&w=384&q=75:0:0)
[ERROR] A tree hydrated but some attributes of the server rendered HTML didn't match the client properties. This won't be patched up. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't match the server.
- External changing data without sending a snapshot of it along with the HTML.
- Invalid HTML tag nesting.

It can also happen if the client has a browser extension installed which messes with the HTML before React loaded.

%s%s https://react.dev/link/hydration-mismatch 

  ...
    <RedirectErrorBoundary router={{...}}>
      <InnerLayoutRouter url="/" tree={[...]} cacheNode={{lazyData:null, ...}} segmentPath={[...]}>
        <SegmentViewNode type="layout" pagePath="(app)/layo...">
          <SegmentTrieNode>
          <AppLayout>
            <div className="flex min-h...">
              ...
                <header className="fixed left...">
                  <PromotionalBanner>
                  <TopBar>
                  <MainHeader>
                    <div className={"bg-white..."} style={{height:"72px"}}>
                      <div className="container ...">
                        <div className="flex items...">
                          <div>
                          <div className="hidden md:...">
                            <AdvancedSearchBar>
                              <form onSubmit={function handleSearch} className="relative f...">
                                <div className="relative">
                                  <Search>
                                  <input
                                    ref={{current:null}}
                                    type="text"
                                    value=""
                                    onChange={function onChange}
                                    onFocus={function onFocus}
                                    placeholder="Rechercher des produits, marques ou catégories..."
                                    className="w-full h-12 pl-12 pr-32 rounded-full border-2 border-gray-200 focus:bor..."
-                                   style={{caret-color:"transparent"}}
                                  >
                                  ...
                          ...
                  ...
              <main>
              <Footer>
                <footer className="bg-gradien...">
                  <NewsletterSubscription className="border-b b...">
                    <section ref={{current:null}} className="relative o...">
                      <div>
                      <div>
                      <div className="container ...">
                        <div className="mx-auto ma...">
                          <div>
                          <div className="" style={{...}}>
                            <form onSubmit={function handleSubmit} className="space-y-4">
                              <div className="flex flex-...">
                                <div className="relative f...">
                                  <Mail>
                                  <_c type="email" placeholder="votre@emai..." value="" onChange={function onChange} ...>
                                    <input
                                      type="email"
                                      className="flex w-full border-input px-3 py-2 ring-offset-background file:border..."
                                      ref={null}
                                      placeholder="votre@email.com"
                                      value=""
                                      onChange={function onChange}
                                      disabled={false}
                                      aria-invalid={false}
                                      aria-describedby={undefined}
-                                     style={{caret-color:"transparent"}}
                                    >
                                ...
                              <label className="flex curso...">
                                <input
                                  type="checkbox"
                                  checked={false}
                                  onChange={function onChange}
                                  disabled={false}
                                  className="mt-0.5 h-5 w-5 flex-shrink-0 cursor-pointer rounded border-2 border-white..."
-                                 style={{caret-color:"transparent"}}
                                >
                                ...
                            ...
                  ...
              ...
      ...
 (at webpack-internal:///(app-pages-browser)/./node_modules/next/dist/next-devtools/userspace/app/errors/intercept-console-error.js:56:31)
[WARNING] Pusher environment variables not configured. Real-time notifications disabled. (at webpack-internal:///(app-pages-browser)/./src/components/header/notifications-dropdown.tsx:43:24)
[ERROR] React does not recognize the `%s` prop on a DOM element. If you intentionally want it to appear in the DOM as a custom attribute, spell it as lowercase `%s` instead. If you accidentally passed it from a parent component, remove it from the DOM element. originalPrice originalprice (at webpack-internal:///(app-pages-browser)/./node_modules/next/dist/next-devtools/userspace/app/errors/intercept-console-error.js:56:31)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-category.jpg&w=384&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fimages%2Fplaceholder.jpg&w=256&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 429 () (at https://ipapi.co/json/:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-collection.jpg&w=1280&q=75:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/156b829b-9a8a-44ee-b876-1736c158544e/c87acab1-9ee1-495b-b485-61e682bf2a82
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC012
- **Test Name:** Real-time Notifications in Admin Panel
- **Test Code:** [TC012_Real_time_Notifications_in_Admin_Panel.py](./TC012_Real_time_Notifications_in_Admin_Panel.py)
- **Test Error:** 
Browser Console Logs:
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-collection.jpg&w=1280&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-category.jpg&w=384&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fimages%2Fplaceholder.jpg&w=256&q=75:0:0)
[ERROR] A tree hydrated but some attributes of the server rendered HTML didn't match the client properties. This won't be patched up. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't match the server.
- External changing data without sending a snapshot of it along with the HTML.
- Invalid HTML tag nesting.

It can also happen if the client has a browser extension installed which messes with the HTML before React loaded.

%s%s https://react.dev/link/hydration-mismatch 

  ...
    <RedirectErrorBoundary router={{...}}>
      <InnerLayoutRouter url="/" tree={[...]} cacheNode={{lazyData:null, ...}} segmentPath={[...]}>
        <SegmentViewNode type="layout" pagePath="(app)/layo...">
          <SegmentTrieNode>
          <AppLayout>
            <div className="flex min-h...">
              ...
                <header className="fixed left...">
                  <PromotionalBanner>
                  <TopBar>
                  <MainHeader>
                    <div className={"bg-white..."} style={{height:"72px"}}>
                      <div className="container ...">
                        <div className="flex items...">
                          <div>
                          <div className="hidden md:...">
                            <AdvancedSearchBar>
                              <form onSubmit={function handleSearch} className="relative f...">
                                <div className="relative">
                                  <Search>
                                  <input
                                    ref={{current:null}}
                                    type="text"
                                    value=""
                                    onChange={function onChange}
                                    onFocus={function onFocus}
                                    placeholder="Rechercher des produits, marques ou catégories..."
                                    className="w-full h-12 pl-12 pr-32 rounded-full border-2 border-gray-200 focus:bor..."
-                                   style={{caret-color:"transparent"}}
                                  >
                                  ...
                          ...
                  ...
              <main>
              <Footer>
                <footer className="bg-gradien...">
                  <NewsletterSubscription className="border-b b...">
                    <section ref={{current:null}} className="relative o...">
                      <div>
                      <div>
                      <div className="container ...">
                        <div className="mx-auto ma...">
                          <div>
                          <div className="" style={{...}}>
                            <form onSubmit={function handleSubmit} className="space-y-4">
                              <div className="flex flex-...">
                                <div className="relative f...">
                                  <Mail>
                                  <_c type="email" placeholder="votre@emai..." value="" onChange={function onChange} ...>
                                    <input
                                      type="email"
                                      className="flex w-full border-input px-3 py-2 ring-offset-background file:border..."
                                      ref={null}
                                      placeholder="votre@email.com"
                                      value=""
                                      onChange={function onChange}
                                      disabled={false}
                                      aria-invalid={false}
                                      aria-describedby={undefined}
-                                     style={{caret-color:"transparent"}}
                                    >
                                ...
                              <label className="flex curso...">
                                <input
                                  type="checkbox"
                                  checked={false}
                                  onChange={function onChange}
                                  disabled={false}
                                  className="mt-0.5 h-5 w-5 flex-shrink-0 cursor-pointer rounded border-2 border-white..."
-                                 style={{caret-color:"transparent"}}
                                >
                                ...
                            ...
                  ...
              ...
      ...
 (at webpack-internal:///(app-pages-browser)/./node_modules/next/dist/next-devtools/userspace/app/errors/intercept-console-error.js:56:31)
[WARNING] Pusher environment variables not configured. Real-time notifications disabled. (at webpack-internal:///(app-pages-browser)/./src/components/header/notifications-dropdown.tsx:43:24)
[ERROR] React does not recognize the `%s` prop on a DOM element. If you intentionally want it to appear in the DOM as a custom attribute, spell it as lowercase `%s` instead. If you accidentally passed it from a parent component, remove it from the DOM element. originalPrice originalprice (at webpack-internal:///(app-pages-browser)/./node_modules/next/dist/next-devtools/userspace/app/errors/intercept-console-error.js:56:31)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-category.jpg&w=384&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fimages%2Fplaceholder.jpg&w=256&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-collection.jpg&w=1280&q=75:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/156b829b-9a8a-44ee-b876-1736c158544e/1691f648-92f5-4f88-9a00-9bfe0a05b1d8
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC013
- **Test Name:** Accessibility Compliance for Key UI Elements
- **Test Code:** [TC013_Accessibility_Compliance_for_Key_UI_Elements.py](./TC013_Accessibility_Compliance_for_Key_UI_Elements.py)
- **Test Error:** 
Browser Console Logs:
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-collection.jpg&w=1280&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-category.jpg&w=384&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fimages%2Fplaceholder.jpg&w=256&q=75:0:0)
[ERROR] A tree hydrated but some attributes of the server rendered HTML didn't match the client properties. This won't be patched up. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't match the server.
- External changing data without sending a snapshot of it along with the HTML.
- Invalid HTML tag nesting.

It can also happen if the client has a browser extension installed which messes with the HTML before React loaded.

%s%s https://react.dev/link/hydration-mismatch 

  ...
    <RedirectErrorBoundary router={{...}}>
      <InnerLayoutRouter url="/" tree={[...]} cacheNode={{lazyData:null, ...}} segmentPath={[...]}>
        <SegmentViewNode type="layout" pagePath="(app)/layo...">
          <SegmentTrieNode>
          <AppLayout>
            <div className="flex min-h...">
              ...
                <header className="fixed left...">
                  <PromotionalBanner>
                  <TopBar>
                  <MainHeader>
                    <div className={"bg-white..."} style={{height:"72px"}}>
                      <div className="container ...">
                        <div className="flex items...">
                          <div>
                          <div className="hidden md:...">
                            <AdvancedSearchBar>
                              <form onSubmit={function handleSearch} className="relative f...">
                                <div className="relative">
                                  <Search>
                                  <input
                                    ref={{current:null}}
                                    type="text"
                                    value=""
                                    onChange={function onChange}
                                    onFocus={function onFocus}
                                    placeholder="Rechercher des produits, marques ou catégories..."
                                    className="w-full h-12 pl-12 pr-32 rounded-full border-2 border-gray-200 focus:bor..."
-                                   style={{caret-color:"transparent"}}
                                  >
                                  ...
                          ...
                  ...
              <main>
              <Footer>
                <footer className="bg-gradien...">
                  <NewsletterSubscription className="border-b b...">
                    <section ref={{current:null}} className="relative o...">
                      <div>
                      <div>
                      <div className="container ...">
                        <div className="mx-auto ma...">
                          <div>
                          <div className="" style={{...}}>
                            <form onSubmit={function handleSubmit} className="space-y-4">
                              <div className="flex flex-...">
                                <div className="relative f...">
                                  <Mail>
                                  <_c type="email" placeholder="votre@emai..." value="" onChange={function onChange} ...>
                                    <input
                                      type="email"
                                      className="flex w-full border-input px-3 py-2 ring-offset-background file:border..."
                                      ref={null}
                                      placeholder="votre@email.com"
                                      value=""
                                      onChange={function onChange}
                                      disabled={false}
                                      aria-invalid={false}
                                      aria-describedby={undefined}
-                                     style={{caret-color:"transparent"}}
                                    >
                                ...
                              <label className="flex curso...">
                                <input
                                  type="checkbox"
                                  checked={false}
                                  onChange={function onChange}
                                  disabled={false}
                                  className="mt-0.5 h-5 w-5 flex-shrink-0 cursor-pointer rounded border-2 border-white..."
-                                 style={{caret-color:"transparent"}}
                                >
                                ...
                            ...
                  ...
              ...
      ...
 (at webpack-internal:///(app-pages-browser)/./node_modules/next/dist/next-devtools/userspace/app/errors/intercept-console-error.js:56:31)
[WARNING] Pusher environment variables not configured. Real-time notifications disabled. (at webpack-internal:///(app-pages-browser)/./src/components/header/notifications-dropdown.tsx:43:24)
[ERROR] React does not recognize the `%s` prop on a DOM element. If you intentionally want it to appear in the DOM as a custom attribute, spell it as lowercase `%s` instead. If you accidentally passed it from a parent component, remove it from the DOM element. originalPrice originalprice (at webpack-internal:///(app-pages-browser)/./node_modules/next/dist/next-devtools/userspace/app/errors/intercept-console-error.js:56:31)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-category.jpg&w=384&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fimages%2Fplaceholder.jpg&w=256&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-collection.jpg&w=1280&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 429 () (at https://ipapi.co/json/:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/156b829b-9a8a-44ee-b876-1736c158544e/92168665-066f-4830-8235-ae11e7742449
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC014
- **Test Name:** API Endpoint Pagination, Filtering, and Sorting
- **Test Code:** [TC014_API_Endpoint_Pagination_Filtering_and_Sorting.py](./TC014_API_Endpoint_Pagination_Filtering_and_Sorting.py)
- **Test Error:** 
Browser Console Logs:
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-collection.jpg&w=1280&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-category.jpg&w=384&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fimages%2Fplaceholder.jpg&w=256&q=75:0:0)
[ERROR] A tree hydrated but some attributes of the server rendered HTML didn't match the client properties. This won't be patched up. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't match the server.
- External changing data without sending a snapshot of it along with the HTML.
- Invalid HTML tag nesting.

It can also happen if the client has a browser extension installed which messes with the HTML before React loaded.

%s%s https://react.dev/link/hydration-mismatch 

  ...
    <RedirectErrorBoundary router={{...}}>
      <InnerLayoutRouter url="/" tree={[...]} cacheNode={{lazyData:null, ...}} segmentPath={[...]}>
        <SegmentViewNode type="layout" pagePath="(app)/layo...">
          <SegmentTrieNode>
          <AppLayout>
            <div className="flex min-h...">
              ...
                <header className="fixed left...">
                  <PromotionalBanner>
                  <TopBar>
                  <MainHeader>
                    <div className={"bg-white..."} style={{height:"72px"}}>
                      <div className="container ...">
                        <div className="flex items...">
                          <div>
                          <div className="hidden md:...">
                            <AdvancedSearchBar>
                              <form onSubmit={function handleSearch} className="relative f...">
                                <div className="relative">
                                  <Search>
                                  <input
                                    ref={{current:null}}
                                    type="text"
                                    value=""
                                    onChange={function onChange}
                                    onFocus={function onFocus}
                                    placeholder="Rechercher des produits, marques ou catégories..."
                                    className="w-full h-12 pl-12 pr-32 rounded-full border-2 border-gray-200 focus:bor..."
-                                   style={{caret-color:"transparent"}}
                                  >
                                  ...
                          ...
                  ...
              <main>
              <Footer>
                <footer className="bg-gradien...">
                  <NewsletterSubscription className="border-b b...">
                    <section ref={{current:null}} className="relative o...">
                      <div>
                      <div>
                      <div className="container ...">
                        <div className="mx-auto ma...">
                          <div>
                          <div className="" style={{...}}>
                            <form onSubmit={function handleSubmit} className="space-y-4">
                              <div className="flex flex-...">
                                <div className="relative f...">
                                  <Mail>
                                  <_c type="email" placeholder="votre@emai..." value="" onChange={function onChange} ...>
                                    <input
                                      type="email"
                                      className="flex w-full border-input px-3 py-2 ring-offset-background file:border..."
                                      ref={null}
                                      placeholder="votre@email.com"
                                      value=""
                                      onChange={function onChange}
                                      disabled={false}
                                      aria-invalid={false}
                                      aria-describedby={undefined}
-                                     style={{caret-color:"transparent"}}
                                    >
                                ...
                              <label className="flex curso...">
                                <input
                                  type="checkbox"
                                  checked={false}
                                  onChange={function onChange}
                                  disabled={false}
                                  className="mt-0.5 h-5 w-5 flex-shrink-0 cursor-pointer rounded border-2 border-white..."
-                                 style={{caret-color:"transparent"}}
                                >
                                ...
                            ...
                  ...
              ...
      ...
 (at webpack-internal:///(app-pages-browser)/./node_modules/next/dist/next-devtools/userspace/app/errors/intercept-console-error.js:56:31)
[WARNING] Pusher environment variables not configured. Real-time notifications disabled. (at webpack-internal:///(app-pages-browser)/./src/components/header/notifications-dropdown.tsx:43:24)
[ERROR] React does not recognize the `%s` prop on a DOM element. If you intentionally want it to appear in the DOM as a custom attribute, spell it as lowercase `%s` instead. If you accidentally passed it from a parent component, remove it from the DOM element. originalPrice originalprice (at webpack-internal:///(app-pages-browser)/./node_modules/next/dist/next-devtools/userspace/app/errors/intercept-console-error.js:56:31)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-category.jpg&w=384&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fimages%2Fplaceholder.jpg&w=256&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-collection.jpg&w=1280&q=75:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/156b829b-9a8a-44ee-b876-1736c158544e/c97152de-5a9a-4ed1-96b9-db8679bd96cd
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC015
- **Test Name:** Audit Logging for Admin Actions
- **Test Code:** [TC015_Audit_Logging_for_Admin_Actions.py](./TC015_Audit_Logging_for_Admin_Actions.py)
- **Test Error:** 
Browser Console Logs:
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-collection.jpg&w=1280&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-category.jpg&w=384&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fimages%2Fplaceholder.jpg&w=256&q=75:0:0)
[ERROR] A tree hydrated but some attributes of the server rendered HTML didn't match the client properties. This won't be patched up. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't match the server.
- External changing data without sending a snapshot of it along with the HTML.
- Invalid HTML tag nesting.

It can also happen if the client has a browser extension installed which messes with the HTML before React loaded.

%s%s https://react.dev/link/hydration-mismatch 

  ...
    <RedirectErrorBoundary router={{...}}>
      <InnerLayoutRouter url="/" tree={[...]} cacheNode={{lazyData:null, ...}} segmentPath={[...]}>
        <SegmentViewNode type="layout" pagePath="(app)/layo...">
          <SegmentTrieNode>
          <AppLayout>
            <div className="flex min-h...">
              ...
                <header className="fixed left...">
                  <PromotionalBanner>
                  <TopBar>
                  <MainHeader>
                    <div className={"bg-white..."} style={{height:"72px"}}>
                      <div className="container ...">
                        <div className="flex items...">
                          <div>
                          <div className="hidden md:...">
                            <AdvancedSearchBar>
                              <form onSubmit={function handleSearch} className="relative f...">
                                <div className="relative">
                                  <Search>
                                  <input
                                    ref={{current:null}}
                                    type="text"
                                    value=""
                                    onChange={function onChange}
                                    onFocus={function onFocus}
                                    placeholder="Rechercher des produits, marques ou catégories..."
                                    className="w-full h-12 pl-12 pr-32 rounded-full border-2 border-gray-200 focus:bor..."
-                                   style={{caret-color:"transparent"}}
                                  >
                                  ...
                          ...
                  ...
              <main>
              <Footer>
                <footer className="bg-gradien...">
                  <NewsletterSubscription className="border-b b...">
                    <section ref={{current:null}} className="relative o...">
                      <div>
                      <div>
                      <div className="container ...">
                        <div className="mx-auto ma...">
                          <div>
                          <div className="" style={{...}}>
                            <form onSubmit={function handleSubmit} className="space-y-4">
                              <div className="flex flex-...">
                                <div className="relative f...">
                                  <Mail>
                                  <_c type="email" placeholder="votre@emai..." value="" onChange={function onChange} ...>
                                    <input
                                      type="email"
                                      className="flex w-full border-input px-3 py-2 ring-offset-background file:border..."
                                      ref={null}
                                      placeholder="votre@email.com"
                                      value=""
                                      onChange={function onChange}
                                      disabled={false}
                                      aria-invalid={false}
                                      aria-describedby={undefined}
-                                     style={{caret-color:"transparent"}}
                                    >
                                ...
                              <label className="flex curso...">
                                <input
                                  type="checkbox"
                                  checked={false}
                                  onChange={function onChange}
                                  disabled={false}
                                  className="mt-0.5 h-5 w-5 flex-shrink-0 cursor-pointer rounded border-2 border-white..."
-                                 style={{caret-color:"transparent"}}
                                >
                                ...
                            ...
                  ...
              ...
      ...
 (at webpack-internal:///(app-pages-browser)/./node_modules/next/dist/next-devtools/userspace/app/errors/intercept-console-error.js:56:31)
[WARNING] Pusher environment variables not configured. Real-time notifications disabled. (at webpack-internal:///(app-pages-browser)/./src/components/header/notifications-dropdown.tsx:43:24)
[ERROR] React does not recognize the `%s` prop on a DOM element. If you intentionally want it to appear in the DOM as a custom attribute, spell it as lowercase `%s` instead. If you accidentally passed it from a parent component, remove it from the DOM element. originalPrice originalprice (at webpack-internal:///(app-pages-browser)/./node_modules/next/dist/next-devtools/userspace/app/errors/intercept-console-error.js:56:31)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-category.jpg&w=384&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fimages%2Fplaceholder.jpg&w=256&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 429 () (at https://ipapi.co/json/:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-collection.jpg&w=1280&q=75:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/156b829b-9a8a-44ee-b876-1736c158544e/f12e8278-f231-485a-b924-33e41c73d403
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC016
- **Test Name:** Wishlist Add and Remove with Persistence
- **Test Code:** [TC016_Wishlist_Add_and_Remove_with_Persistence.py](./TC016_Wishlist_Add_and_Remove_with_Persistence.py)
- **Test Error:** 
Browser Console Logs:
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-collection.jpg&w=1280&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-category.jpg&w=384&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fimages%2Fplaceholder.jpg&w=256&q=75:0:0)
[ERROR] A tree hydrated but some attributes of the server rendered HTML didn't match the client properties. This won't be patched up. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't match the server.
- External changing data without sending a snapshot of it along with the HTML.
- Invalid HTML tag nesting.

It can also happen if the client has a browser extension installed which messes with the HTML before React loaded.

%s%s https://react.dev/link/hydration-mismatch 

  ...
    <RedirectErrorBoundary router={{...}}>
      <InnerLayoutRouter url="/" tree={[...]} cacheNode={{lazyData:null, ...}} segmentPath={[...]}>
        <SegmentViewNode type="layout" pagePath="(app)/layo...">
          <SegmentTrieNode>
          <AppLayout>
            <div className="flex min-h...">
              ...
                <header className="fixed left...">
                  <PromotionalBanner>
                  <TopBar>
                  <MainHeader>
                    <div className={"bg-white..."} style={{height:"72px"}}>
                      <div className="container ...">
                        <div className="flex items...">
                          <div>
                          <div className="hidden md:...">
                            <AdvancedSearchBar>
                              <form onSubmit={function handleSearch} className="relative f...">
                                <div className="relative">
                                  <Search>
                                  <input
                                    ref={{current:null}}
                                    type="text"
                                    value=""
                                    onChange={function onChange}
                                    onFocus={function onFocus}
                                    placeholder="Rechercher des produits, marques ou catégories..."
                                    className="w-full h-12 pl-12 pr-32 rounded-full border-2 border-gray-200 focus:bor..."
-                                   style={{caret-color:"transparent"}}
                                  >
                                  ...
                          ...
                  ...
              <main>
              <Footer>
                <footer className="bg-gradien...">
                  <NewsletterSubscription className="border-b b...">
                    <section ref={{current:null}} className="relative o...">
                      <div>
                      <div>
                      <div className="container ...">
                        <div className="mx-auto ma...">
                          <div>
                          <div className="" style={{...}}>
                            <form onSubmit={function handleSubmit} className="space-y-4">
                              <div className="flex flex-...">
                                <div className="relative f...">
                                  <Mail>
                                  <_c type="email" placeholder="votre@emai..." value="" onChange={function onChange} ...>
                                    <input
                                      type="email"
                                      className="flex w-full border-input px-3 py-2 ring-offset-background file:border..."
                                      ref={null}
                                      placeholder="votre@email.com"
                                      value=""
                                      onChange={function onChange}
                                      disabled={false}
                                      aria-invalid={false}
                                      aria-describedby={undefined}
-                                     style={{caret-color:"transparent"}}
                                    >
                                ...
                              <label className="flex curso...">
                                <input
                                  type="checkbox"
                                  checked={false}
                                  onChange={function onChange}
                                  disabled={false}
                                  className="mt-0.5 h-5 w-5 flex-shrink-0 cursor-pointer rounded border-2 border-white..."
-                                 style={{caret-color:"transparent"}}
                                >
                                ...
                            ...
                  ...
              ...
      ...
 (at webpack-internal:///(app-pages-browser)/./node_modules/next/dist/next-devtools/userspace/app/errors/intercept-console-error.js:56:31)
[WARNING] Pusher environment variables not configured. Real-time notifications disabled. (at webpack-internal:///(app-pages-browser)/./src/components/header/notifications-dropdown.tsx:43:24)
[ERROR] React does not recognize the `%s` prop on a DOM element. If you intentionally want it to appear in the DOM as a custom attribute, spell it as lowercase `%s` instead. If you accidentally passed it from a parent component, remove it from the DOM element. originalPrice originalprice (at webpack-internal:///(app-pages-browser)/./node_modules/next/dist/next-devtools/userspace/app/errors/intercept-console-error.js:56:31)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-category.jpg&w=384&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-collection.jpg&w=1280&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fimages%2Fplaceholder.jpg&w=256&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 429 () (at https://ipapi.co/json/:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/156b829b-9a8a-44ee-b876-1736c158544e/9789f4b0-d5d9-4b56-8f53-a4b5d4ebd071
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC017
- **Test Name:** Product Review Submission and Verification
- **Test Code:** [TC017_Product_Review_Submission_and_Verification.py](./TC017_Product_Review_Submission_and_Verification.py)
- **Test Error:** 
Browser Console Logs:
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-collection.jpg&w=1280&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-category.jpg&w=384&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fimages%2Fplaceholder.jpg&w=256&q=75:0:0)
[ERROR] A tree hydrated but some attributes of the server rendered HTML didn't match the client properties. This won't be patched up. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't match the server.
- External changing data without sending a snapshot of it along with the HTML.
- Invalid HTML tag nesting.

It can also happen if the client has a browser extension installed which messes with the HTML before React loaded.

%s%s https://react.dev/link/hydration-mismatch 

  ...
    <RedirectErrorBoundary router={{...}}>
      <InnerLayoutRouter url="/" tree={[...]} cacheNode={{lazyData:null, ...}} segmentPath={[...]}>
        <SegmentViewNode type="layout" pagePath="(app)/layo...">
          <SegmentTrieNode>
          <AppLayout>
            <div className="flex min-h...">
              ...
                <header className="fixed left...">
                  <PromotionalBanner>
                  <TopBar>
                  <MainHeader>
                    <div className={"bg-white..."} style={{height:"72px"}}>
                      <div className="container ...">
                        <div className="flex items...">
                          <div>
                          <div className="hidden md:...">
                            <AdvancedSearchBar>
                              <form onSubmit={function handleSearch} className="relative f...">
                                <div className="relative">
                                  <Search>
                                  <input
                                    ref={{current:null}}
                                    type="text"
                                    value=""
                                    onChange={function onChange}
                                    onFocus={function onFocus}
                                    placeholder="Rechercher des produits, marques ou catégories..."
                                    className="w-full h-12 pl-12 pr-32 rounded-full border-2 border-gray-200 focus:bor..."
-                                   style={{caret-color:"transparent"}}
                                  >
                                  ...
                          ...
                  ...
              <main>
              <Footer>
                <footer className="bg-gradien...">
                  <NewsletterSubscription className="border-b b...">
                    <section ref={{current:null}} className="relative o...">
                      <div>
                      <div>
                      <div className="container ...">
                        <div className="mx-auto ma...">
                          <div>
                          <div className="" style={{...}}>
                            <form onSubmit={function handleSubmit} className="space-y-4">
                              <div className="flex flex-...">
                                <div className="relative f...">
                                  <Mail>
                                  <_c type="email" placeholder="votre@emai..." value="" onChange={function onChange} ...>
                                    <input
                                      type="email"
                                      className="flex w-full border-input px-3 py-2 ring-offset-background file:border..."
                                      ref={null}
                                      placeholder="votre@email.com"
                                      value=""
                                      onChange={function onChange}
                                      disabled={false}
                                      aria-invalid={false}
                                      aria-describedby={undefined}
-                                     style={{caret-color:"transparent"}}
                                    >
                                ...
                              <label className="flex curso...">
                                <input
                                  type="checkbox"
                                  checked={false}
                                  onChange={function onChange}
                                  disabled={false}
                                  className="mt-0.5 h-5 w-5 flex-shrink-0 cursor-pointer rounded border-2 border-white..."
-                                 style={{caret-color:"transparent"}}
                                >
                                ...
                            ...
                  ...
              ...
      ...
 (at webpack-internal:///(app-pages-browser)/./node_modules/next/dist/next-devtools/userspace/app/errors/intercept-console-error.js:56:31)
[WARNING] Pusher environment variables not configured. Real-time notifications disabled. (at webpack-internal:///(app-pages-browser)/./src/components/header/notifications-dropdown.tsx:43:24)
[ERROR] React does not recognize the `%s` prop on a DOM element. If you intentionally want it to appear in the DOM as a custom attribute, spell it as lowercase `%s` instead. If you accidentally passed it from a parent component, remove it from the DOM element. originalPrice originalprice (at webpack-internal:///(app-pages-browser)/./node_modules/next/dist/next-devtools/userspace/app/errors/intercept-console-error.js:56:31)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-category.jpg&w=384&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fimages%2Fplaceholder.jpg&w=256&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 429 () (at https://ipapi.co/json/:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-collection.jpg&w=1280&q=75:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/156b829b-9a8a-44ee-b876-1736c158544e/83936139-9537-4416-a5fa-d4482f641a80
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC018
- **Test Name:** Responsive UI Across Desktop and Mobile Devices
- **Test Code:** [TC018_Responsive_UI_Across_Desktop_and_Mobile_Devices.py](./TC018_Responsive_UI_Across_Desktop_and_Mobile_Devices.py)
- **Test Error:** 
Browser Console Logs:
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-collection.jpg&w=1280&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-category.jpg&w=384&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fimages%2Fplaceholder.jpg&w=256&q=75:0:0)
[ERROR] A tree hydrated but some attributes of the server rendered HTML didn't match the client properties. This won't be patched up. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't match the server.
- External changing data without sending a snapshot of it along with the HTML.
- Invalid HTML tag nesting.

It can also happen if the client has a browser extension installed which messes with the HTML before React loaded.

%s%s https://react.dev/link/hydration-mismatch 

  ...
    <RedirectErrorBoundary router={{...}}>
      <InnerLayoutRouter url="/" tree={[...]} cacheNode={{lazyData:null, ...}} segmentPath={[...]}>
        <SegmentViewNode type="layout" pagePath="(app)/layo...">
          <SegmentTrieNode>
          <AppLayout>
            <div className="flex min-h...">
              ...
                <header className="fixed left...">
                  <PromotionalBanner>
                  <TopBar>
                  <MainHeader>
                    <div className={"bg-white..."} style={{height:"72px"}}>
                      <div className="container ...">
                        <div className="flex items...">
                          <div>
                          <div className="hidden md:...">
                            <AdvancedSearchBar>
                              <form onSubmit={function handleSearch} className="relative f...">
                                <div className="relative">
                                  <Search>
                                  <input
                                    ref={{current:null}}
                                    type="text"
                                    value=""
                                    onChange={function onChange}
                                    onFocus={function onFocus}
                                    placeholder="Rechercher des produits, marques ou catégories..."
                                    className="w-full h-12 pl-12 pr-32 rounded-full border-2 border-gray-200 focus:bor..."
-                                   style={{caret-color:"transparent"}}
                                  >
                                  ...
                          ...
                  ...
              <main>
              <Footer>
                <footer className="bg-gradien...">
                  <NewsletterSubscription className="border-b b...">
                    <section ref={{current:null}} className="relative o...">
                      <div>
                      <div>
                      <div className="container ...">
                        <div className="mx-auto ma...">
                          <div>
                          <div className="" style={{...}}>
                            <form onSubmit={function handleSubmit} className="space-y-4">
                              <div className="flex flex-...">
                                <div className="relative f...">
                                  <Mail>
                                  <_c type="email" placeholder="votre@emai..." value="" onChange={function onChange} ...>
                                    <input
                                      type="email"
                                      className="flex w-full border-input px-3 py-2 ring-offset-background file:border..."
                                      ref={null}
                                      placeholder="votre@email.com"
                                      value=""
                                      onChange={function onChange}
                                      disabled={false}
                                      aria-invalid={false}
                                      aria-describedby={undefined}
-                                     style={{caret-color:"transparent"}}
                                    >
                                ...
                              <label className="flex curso...">
                                <input
                                  type="checkbox"
                                  checked={false}
                                  onChange={function onChange}
                                  disabled={false}
                                  className="mt-0.5 h-5 w-5 flex-shrink-0 cursor-pointer rounded border-2 border-white..."
-                                 style={{caret-color:"transparent"}}
                                >
                                ...
                            ...
                  ...
              ...
      ...
 (at webpack-internal:///(app-pages-browser)/./node_modules/next/dist/next-devtools/userspace/app/errors/intercept-console-error.js:56:31)
[WARNING] Pusher environment variables not configured. Real-time notifications disabled. (at webpack-internal:///(app-pages-browser)/./src/components/header/notifications-dropdown.tsx:43:24)
[ERROR] React does not recognize the `%s` prop on a DOM element. If you intentionally want it to appear in the DOM as a custom attribute, spell it as lowercase `%s` instead. If you accidentally passed it from a parent component, remove it from the DOM element. originalPrice originalprice (at webpack-internal:///(app-pages-browser)/./node_modules/next/dist/next-devtools/userspace/app/errors/intercept-console-error.js:56:31)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-category.jpg&w=384&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fimages%2Fplaceholder.jpg&w=256&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-collection.jpg&w=1280&q=75:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/156b829b-9a8a-44ee-b876-1736c158544e/60e36457-aaa8-47ee-8cb1-1ef619f6a2ca
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC019
- **Test Name:** Order Creation and Status Update via API and Webhooks
- **Test Code:** [TC019_Order_Creation_and_Status_Update_via_API_and_Webhooks.py](./TC019_Order_Creation_and_Status_Update_via_API_and_Webhooks.py)
- **Test Error:** 
Browser Console Logs:
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-collection.jpg&w=1280&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-category.jpg&w=384&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fimages%2Fplaceholder.jpg&w=256&q=75:0:0)
[ERROR] A tree hydrated but some attributes of the server rendered HTML didn't match the client properties. This won't be patched up. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't match the server.
- External changing data without sending a snapshot of it along with the HTML.
- Invalid HTML tag nesting.

It can also happen if the client has a browser extension installed which messes with the HTML before React loaded.

%s%s https://react.dev/link/hydration-mismatch 

  ...
    <RedirectErrorBoundary router={{...}}>
      <InnerLayoutRouter url="/" tree={[...]} cacheNode={{lazyData:null, ...}} segmentPath={[...]}>
        <SegmentViewNode type="layout" pagePath="(app)/layo...">
          <SegmentTrieNode>
          <AppLayout>
            <div className="flex min-h...">
              ...
                <header className="fixed left...">
                  <PromotionalBanner>
                  <TopBar>
                  <MainHeader>
                    <div className={"bg-white..."} style={{height:"72px"}}>
                      <div className="container ...">
                        <div className="flex items...">
                          <div>
                          <div className="hidden md:...">
                            <AdvancedSearchBar>
                              <form onSubmit={function handleSearch} className="relative f...">
                                <div className="relative">
                                  <Search>
                                  <input
                                    ref={{current:null}}
                                    type="text"
                                    value=""
                                    onChange={function onChange}
                                    onFocus={function onFocus}
                                    placeholder="Rechercher des produits, marques ou catégories..."
                                    className="w-full h-12 pl-12 pr-32 rounded-full border-2 border-gray-200 focus:bor..."
-                                   style={{caret-color:"transparent"}}
                                  >
                                  ...
                          ...
                  ...
              <main>
              <Footer>
                <footer className="bg-gradien...">
                  <NewsletterSubscription className="border-b b...">
                    <section ref={{current:null}} className="relative o...">
                      <div>
                      <div>
                      <div className="container ...">
                        <div className="mx-auto ma...">
                          <div>
                          <div className="" style={{...}}>
                            <form onSubmit={function handleSubmit} className="space-y-4">
                              <div className="flex flex-...">
                                <div className="relative f...">
                                  <Mail>
                                  <_c type="email" placeholder="votre@emai..." value="" onChange={function onChange} ...>
                                    <input
                                      type="email"
                                      className="flex w-full border-input px-3 py-2 ring-offset-background file:border..."
                                      ref={null}
                                      placeholder="votre@email.com"
                                      value=""
                                      onChange={function onChange}
                                      disabled={false}
                                      aria-invalid={false}
                                      aria-describedby={undefined}
-                                     style={{caret-color:"transparent"}}
                                    >
                                ...
                              <label className="flex curso...">
                                <input
                                  type="checkbox"
                                  checked={false}
                                  onChange={function onChange}
                                  disabled={false}
                                  className="mt-0.5 h-5 w-5 flex-shrink-0 cursor-pointer rounded border-2 border-white..."
-                                 style={{caret-color:"transparent"}}
                                >
                                ...
                            ...
                  ...
              ...
      ...
 (at webpack-internal:///(app-pages-browser)/./node_modules/next/dist/next-devtools/userspace/app/errors/intercept-console-error.js:56:31)
[WARNING] Pusher environment variables not configured. Real-time notifications disabled. (at webpack-internal:///(app-pages-browser)/./src/components/header/notifications-dropdown.tsx:43:24)
[ERROR] React does not recognize the `%s` prop on a DOM element. If you intentionally want it to appear in the DOM as a custom attribute, spell it as lowercase `%s` instead. If you accidentally passed it from a parent component, remove it from the DOM element. originalPrice originalprice (at webpack-internal:///(app-pages-browser)/./node_modules/next/dist/next-devtools/userspace/app/errors/intercept-console-error.js:56:31)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-category.jpg&w=384&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fimages%2Fplaceholder.jpg&w=256&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-collection.jpg&w=1280&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 429 () (at https://ipapi.co/json/:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/156b829b-9a8a-44ee-b876-1736c158544e/10fc60e0-1138-4a85-ae84-5eaaf4c79b76
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC020
- **Test Name:** Security Enforcement on Protected Routes and APIs
- **Test Code:** [TC020_Security_Enforcement_on_Protected_Routes_and_APIs.py](./TC020_Security_Enforcement_on_Protected_Routes_and_APIs.py)
- **Test Error:** 
Browser Console Logs:
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-collection.jpg&w=1280&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-category.jpg&w=384&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fimages%2Fplaceholder.jpg&w=256&q=75:0:0)
[ERROR] A tree hydrated but some attributes of the server rendered HTML didn't match the client properties. This won't be patched up. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't match the server.
- External changing data without sending a snapshot of it along with the HTML.
- Invalid HTML tag nesting.

It can also happen if the client has a browser extension installed which messes with the HTML before React loaded.

%s%s https://react.dev/link/hydration-mismatch 

  ...
    <RedirectErrorBoundary router={{...}}>
      <InnerLayoutRouter url="/" tree={[...]} cacheNode={{lazyData:null, ...}} segmentPath={[...]}>
        <SegmentViewNode type="layout" pagePath="(app)/layo...">
          <SegmentTrieNode>
          <AppLayout>
            <div className="flex min-h...">
              ...
                <header className="fixed left...">
                  <PromotionalBanner>
                  <TopBar>
                  <MainHeader>
                    <div className={"bg-white..."} style={{height:"72px"}}>
                      <div className="container ...">
                        <div className="flex items...">
                          <div>
                          <div className="hidden md:...">
                            <AdvancedSearchBar>
                              <form onSubmit={function handleSearch} className="relative f...">
                                <div className="relative">
                                  <Search>
                                  <input
                                    ref={{current:null}}
                                    type="text"
                                    value=""
                                    onChange={function onChange}
                                    onFocus={function onFocus}
                                    placeholder="Rechercher des produits, marques ou catégories..."
                                    className="w-full h-12 pl-12 pr-32 rounded-full border-2 border-gray-200 focus:bor..."
-                                   style={{caret-color:"transparent"}}
                                  >
                                  ...
                          ...
                  ...
              <main>
              <Footer>
                <footer className="bg-gradien...">
                  <NewsletterSubscription className="border-b b...">
                    <section ref={{current:null}} className="relative o...">
                      <div>
                      <div>
                      <div className="container ...">
                        <div className="mx-auto ma...">
                          <div>
                          <div className="" style={{...}}>
                            <form onSubmit={function handleSubmit} className="space-y-4">
                              <div className="flex flex-...">
                                <div className="relative f...">
                                  <Mail>
                                  <_c type="email" placeholder="votre@emai..." value="" onChange={function onChange} ...>
                                    <input
                                      type="email"
                                      className="flex w-full border-input px-3 py-2 ring-offset-background file:border..."
                                      ref={null}
                                      placeholder="votre@email.com"
                                      value=""
                                      onChange={function onChange}
                                      disabled={false}
                                      aria-invalid={false}
                                      aria-describedby={undefined}
-                                     style={{caret-color:"transparent"}}
                                    >
                                ...
                              <label className="flex curso...">
                                <input
                                  type="checkbox"
                                  checked={false}
                                  onChange={function onChange}
                                  disabled={false}
                                  className="mt-0.5 h-5 w-5 flex-shrink-0 cursor-pointer rounded border-2 border-white..."
-                                 style={{caret-color:"transparent"}}
                                >
                                ...
                            ...
                  ...
              ...
      ...
 (at webpack-internal:///(app-pages-browser)/./node_modules/next/dist/next-devtools/userspace/app/errors/intercept-console-error.js:56:31)
[WARNING] Pusher environment variables not configured. Real-time notifications disabled. (at webpack-internal:///(app-pages-browser)/./src/components/header/notifications-dropdown.tsx:43:24)
[ERROR] React does not recognize the `%s` prop on a DOM element. If you intentionally want it to appear in the DOM as a custom attribute, spell it as lowercase `%s` instead. If you accidentally passed it from a parent component, remove it from the DOM element. originalPrice originalprice (at webpack-internal:///(app-pages-browser)/./node_modules/next/dist/next-devtools/userspace/app/errors/intercept-console-error.js:56:31)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-category.jpg&w=384&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fimages%2Fplaceholder.jpg&w=256&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:3000/_next/image?url=%2Fplaceholder-collection.jpg&w=1280&q=75:0:0)
[ERROR] Failed to load resource: the server responded with a status of 429 () (at https://ipapi.co/json/:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/156b829b-9a8a-44ee-b876-1736c158544e/d5dd1edc-b88f-44bd-907c-2b0ceea7c7c7
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **0.00** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---