// src/features/products/productSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct, searchProducts } from '../../api/products';

export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (params = {}) => {
    const response = await getProducts(params);
    return response.data; // CORRECTED: Return only .data
  }
);

export const fetchProductById = createAsyncThunk(
  'products/fetchProductById',
  async (id) => {
    const response = await getProductById(id);
    return response.data; // CORRECTED: Return only .data
  }
);

export const addNewProduct = createAsyncThunk(
  'products/addNewProduct',
  async (productData) => {
    const response = await createProduct(productData);
    return response.data; // CORRECTED: Return only .data
  }
);

export const updateExistingProduct = createAsyncThunk(
  'products/updateExistingProduct',
  async ({ id, productData }) => {
    const response = await updateProduct(id, productData);
    return response.data; // CORRECTED: Return only .data
  }
);

export const removeProduct = createAsyncThunk(
  'products/removeProduct',
  async (id) => {
    await deleteProduct(id);
    return id; // This already returns id, which is serializable
  }
);

export const searchProductsAction = createAsyncThunk(
  'products/searchProducts',
  async (query) => {
    const response = await searchProducts(query);
    return response.data; // CORRECTED: Return only .data
  }
);

const productSlice = createSlice({
  name: 'products',
  initialState: {
    products: [],
    pagination: {},
    currentProduct: null,
    searchResults: [],
    loading: false,
    error: null,
  },
  reducers: {
    setProducts: (state, action) => {
      state.products = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
    setCurrentProduct: (state, action) => {
      state.currentProduct = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        // Ensure action.payload has 'products' and 'pagination' properties
        if (action.payload && Array.isArray(action.payload.products) && action.payload.pagination) {
          state.products = action.payload.products;
          state.pagination = action.payload.pagination;
        } else {
          console.error('fetchProducts.fulfilled: Unexpected payload structure', action.payload);
          state.error = 'Unexpected data structure from server.';
          state.products = [];
        }
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchProductById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProduct = action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(addNewProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addNewProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.products.push(action.payload);
      })
      .addCase(addNewProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(updateExistingProduct.fulfilled, (state, action) => {
        const index = state.products.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.products[index] = action.payload;
        }
      })
      .addCase(removeProduct.fulfilled, (state, action) => {
        state.products = state.products.filter(p => p.id !== action.payload);
      })
      .addCase(searchProductsAction.fulfilled, (state, action) => {
        // Assuming searchProducts also returns { products: [...], pagination: {...} }
        if (action.payload && Array.isArray(action.payload.products)) {
          state.searchResults = action.payload.products;
        } else {
          console.error('searchProductsAction.fulfilled: Unexpected payload structure', action.payload);
          state.searchResults = [];
        }
      });
  },
});

export const { setProducts, clearError, clearSearchResults, setCurrentProduct } = productSlice.actions;
export const addProduct = addNewProduct; // Alias

export default productSlice.reducer;
