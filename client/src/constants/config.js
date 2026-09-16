// API NOTIFICATION MESSAGES
export const API_NOTIFICATION_MESSAGES = {
    loading: {
        title: "Loading...",
        message: "Data is being loaded. Please wait"
    },
    success: {
        title: "Success",
        message: "Data successfully loaded"
    },
    requestFailure: "An error occurred while parsing request data.",
    responseFailure: "An error occurred while fetching response from server. Please try again.",
    networkError: "Unable to connect to the server. Please check internet connectivity and try again."
}

// API SERVICE URL
export const SERVICE_URLS = {
    userLogin:       { url: '/login',             method: 'POST' },
    userSignup:      { url: '/signup',            method: 'POST' },
    userLogout:      { url: '/logout',            method: 'POST' },
    getRefreshToken: { url: '/token',             method: 'POST' },

    // Blogs (matching Laravel base-module)
    getAllBlogs:     { url: '/blogs',             method: 'GET',    params: true },
    getBlogById:     { url: '/blog',              method: 'GET',    query: true  },
    createBlog:      { url: '/blog',              method: 'POST' },
    updateBlog:      { url: '/blog',              method: 'PUT',    query: true  },
    deleteBlog:      { url: '/blog',              method: 'DELETE', query: true  },
    toggleBlogPublish:{ url: '/blog/toggle',      method: 'PATCH',  query: true  },

    // Posts (backward compatibility)
    getAllPosts:     { url: '/blogs',             method: 'GET',    params: true },
    getPostById:    { url: '/blog',              method: 'GET',    query: true  },
    createPost:     { url: '/blog',              method: 'POST' },
    updatePost:     { url: '/blog',              method: 'PUT',    query: true  },
    deletePost:     { url: '/blog',              method: 'DELETE', query: true  },
    togglePublish:  { url: '/blog/toggle',       method: 'PATCH',  query: true  },

    // Files
    uploadFile:       { url: '/file/upload',             method: 'POST' },
    getUploadedFiles: { url: '/file/get_uploaded_files', method: 'GET',    params: true },
    deleteFile:       { url: '/file/delete',             method: 'DELETE', query: true },


    // Categories
    getCategories:  { url: '/categories',        method: 'GET',    params: true },
    createCategory: { url: '/category',          method: 'POST' },
    getUserPurchasedCategories: { url: '/user/purchased-categories', method: 'GET' },

    // Comments
    newComment:     { url: '/comment/new',       method: 'POST' },
    getAllComments:  { url: '/comments',          method: 'GET',    query: true  },
    deleteComment:  { url: '/comment/delete',    method: 'DELETE', query: true  },

    // Payments
    createCheckoutSession: { url: '/api/stripe/create-checkout-session', method: 'POST' },
    createCategoryCheckoutSession: { url: '/api/stripe/create-category-checkout-session', method: 'POST' },
    verifyPaymentSuccess:  { url: '/verify-success',                     method: 'GET',    params: true },
    verifyPaymentCancel:   { url: '/verify-cancel',                      method: 'GET',    params: true },
    getAllPayments:        { url: '/payments',                           method: 'GET' }
}