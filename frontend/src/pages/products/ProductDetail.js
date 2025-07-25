import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import productsAPI from '../../api/products';
import Loading from '../../components/common/Loading';
import { toast } from 'react-toastify';
import { FaEdit, FaArrowLeft, FaTimes } from 'react-icons/fa';

// Get the backend API URL from environment variables, with a fallback
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Helper component to avoid showing empty fields
const DetailItem = ({ label, value }) => {
    if (value === null || value === undefined || value === '') {
        return null;
    }
    return (
        <div className="py-2 px-4 border-b border-gray-200">
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <p className="text-md text-gray-800 whitespace-pre-wrap">{value}</p>
        </div>
    );
};

export const ProductDetail = () => {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false); // State for the image modal

    useEffect(() => {
        const fetchProduct = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await productsAPI.getProductById(id);
                setProduct(response);
            } catch (err) {
                console.error('Failed to fetch product:', err);
                setError('Product not found or failed to load.');
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    if (loading) return <Loading />;

    if (error) {
        return (
            <div className="text-red-500 text-center py-12 text-lg">
                {error}
                <Link to="/products" className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Back to Products
                </Link>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="text-center py-12 text-gray-600">
                <p className="text-lg mb-4">Product not found.</p>
                <Link to="/products" className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Back to Products
                </Link>
            </div>
        );
    }
    
    const imageUrl = product.image ? `${API_URL}/${product.image.replace(/\\/g, '/')}` : null;

    return (
        <>
            <div className="container mx-auto p-4 bg-gray-50 min-h-screen">
                <div className="bg-white p-6 rounded-lg shadow-lg">
                    <div className="flex justify-between items-center border-b pb-4 mb-4">
                        <h1 className="text-3xl font-bold text-gray-800">Product Details</h1>
                        <div className="flex items-center space-x-4">
                            <Link to="/products" className="flex items-center text-blue-600 hover:text-blue-800">
                                <FaArrowLeft className="mr-2" />
                                Back to List
                            </Link>
                            <Link to={`/products/edit/${product.id}`} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center">
                                <FaEdit className="mr-2" />
                                Edit
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Left Column for Image */}
                        <div className="md:col-span-1">
                            {imageUrl ? (
                                <img
                                    src={imageUrl}
                                    alt={product.name}
                                    className="w-full h-auto object-cover rounded-lg shadow-md border cursor-pointer hover:opacity-80 transition"
                                    onClick={() => setIsModalOpen(true)} // Open modal on click
                                />
                            ) : (
                                <div className="w-full h-64 bg-gray-200 flex items-center justify-center rounded-lg text-gray-500">
                                    No Image Available
                                </div>
                            )}
                        </div>

                        {/* Right Column for Details */}
                        <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg border">
                            <h2 className="text-2xl font-semibold mb-4 text-gray-900">{product.name}</h2>
                            {product.nameUrdu && <h3 className="text-xl font-semibold mb-4 text-right text-gray-700" dir="rtl">{product.nameUrdu}</h3>}
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                                <DetailItem label="Selling Price" value={`Rs ${parseFloat(product.sellingPrice || 0).toFixed(2)}`} />
                                <DetailItem label="Purchase Price" value={`Rs ${parseFloat(product.purchasePrice || 0).toFixed(2)}`} />
                                <DetailItem label="Stock" value={product.stock ?? 'N/A'} />
                                <DetailItem label="Category" value={product.category || 'N/A'} />
                                <DetailItem label="SKU" value={product.sku || 'N/A'} />
                                <DetailItem label="Supplier" value={product.supplier || 'N/A'} />
                                <DetailItem label="Storage Location" value={product.storageLocation || 'N/A'} />
                                <DetailItem label="Expiry Date" value={product.expiryDate ? new Date(product.expiryDate).toLocaleDateString() : 'N/A'} />
                            </div>
                            
                            <div className="mt-4">
                                <div className="py-2 px-4 border-b border-gray-200">
                                    <p className="text-sm font-medium text-gray-500">Description</p>
                                    <div className="text-md text-gray-800 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: product.description || 'N/A' }} />
                                </div>
                                <DetailItem label="Applications" value={product.applications || 'N/A'} />
                                <DetailItem label="Comments" value={product.comments || 'N/A'} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Image Modal */}
            {isModalOpen && imageUrl && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
                    onClick={() => setIsModalOpen(false)} // Close modal on overlay click
                >
                    <div className="relative p-4">
                        <button 
                            onClick={() => setIsModalOpen(false)} 
                            className="absolute -top-4 -right-4 bg-white text-black rounded-full p-2"
                        >
                            <FaTimes size={20}/>
                        </button>
                        <img 
                            src={imageUrl} 
                            alt={product.name} 
                            className="max-w-[90vw] max-h-[90vh] object-contain"
                        />
                    </div>
                </div>
            )}
        </>
    );
};

export default ProductDetail;