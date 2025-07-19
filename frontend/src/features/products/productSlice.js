// src/features/products/productSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct, searchProducts } from '../../api/products';

export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (params = {}) => {
    const response = await getProducts(params);
    // The API response is an object like { products: [...], pagination: {...} }
    return response;
  }
);

export const fetchProductById = createAsyncThunk(
  'products/fetchProductById',
  async (id) => {
    const response = await getProductById(id);
    return response;
  }
);

export const addNewProduct = createAsyncThunk(
  'products/addNewProduct',
  async (productData) => {
    const response = await createProduct(productData);
    return response;
  }
);

export const updateExistingProduct = createAsyncThunk(
  'products/updateExistingProduct',
  async ({ id, productData }) => {
    const response = await updateProduct(id, productData);
    return response;
  }
);

export const removeProduct = createAsyncThunk(
  'products/removeProduct',
  async (id) => {
    await deleteProduct(id);
    return id;
  }
);

export const searchProductsAction = createAsyncThunk(
  'products/searchProducts',
  async (query) => {
    const response = await searchProducts(query);
    return response;
  }
);

const productSlice = createSlice({
  name: 'products',
  initialState: {
    products: [], // This should always hold the array of products
    pagination: {}, // Add pagination to the state
    currentProduct: null,
    searchResults: [],
    loading: false, // Use a boolean 'loading' flag
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
        // CRITICAL FIX: Extract the 'products' array from the payload
        state.products = action.payload.products;
        state.pagination = action.payload.pagination; // Store pagination data
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
        // Assuming addNewProduct returns the new product directly
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
        state.searchResults = action.payload.products;
        // You might also want to update state.pagination here if search affects it
      });
  },
});

export const { setProducts, clearError, clearSearchResults, setCurrentProduct } = productSlice.actions;

// Add aliases for the expected function names
export const addProduct = addNewProduct;

export default productSlice.reducer;