import { hooks, api } from '@bigcommerce/stencil-utils';
import CatalogPage from './catalog';
import compareProducts from './global/compare-products';
import FacetedSearch from './common/faceted-search';
import swal from './global/sweet-alert';
import { createTranslationDictionary } from '../theme/common/utils/translations-utils';

export default class Category extends CatalogPage {
    constructor(context) {
        super(context);
        this.validationDictionary = createTranslationDictionary(context);
    }

    setLiveRegionAttributes($element, roleType, ariaLiveStatus) {
        $element.attr({
            role: roleType,
            'aria-live': ariaLiveStatus,
        });
    }

    makeShopByPriceFilterAccessible() {
        if (!$('[data-shop-by-price]').length) return;

        if ($('.navList-action').hasClass('is-active')) {
            $('a.navList-action.is-active').focus();
        }

        $('a.navList-action').on('click', () => this.setLiveRegionAttributes($('span.price-filter-message'), 'status', 'assertive'));
    }

    onReady() {
        this.arrangeFocusOnSortBy();

        $('[data-button-type="add-cart"]').on('click', (e) => this.setLiveRegionAttributes($(e.currentTarget).next(), 'status', 'polite'));

        this.makeShopByPriceFilterAccessible();

        compareProducts(this.context);

        if ($('#facetedSearch').length > 0) {
            this.initFacetedSearch();
        } else {
            this.onSortBySubmit = this.onSortBySubmit.bind(this);
            hooks.on('sortBy-submitted', this.onSortBySubmit);
        }

        $('a.reset-btn').on('click', () => this.setLiveRegionsAttributes($('span.reset-message'), 'status', 'polite'));

        this.ariaNotifyNoProducts();

        this.initCategoryCartButtons();
    }

    ariaNotifyNoProducts() {
        const $noProductsMessage = $('[data-no-products-notification]');
        if ($noProductsMessage.length) {
            $noProductsMessage.focus();
        }
    }

    initFacetedSearch() {
        const {
            price_min_evaluation: onMinPriceError,
            price_max_evaluation: onMaxPriceError,
            price_min_not_entered: minPriceNotEntered,
            price_max_not_entered: maxPriceNotEntered,
            price_invalid_value: onInvalidPrice,
        } = this.validationDictionary;
        const $productListingContainer = $('#product-listing-container');
        const $facetedSearchContainer = $('#faceted-search-container');
        const productsPerPage = this.context.categoryProductsPerPage;
        const requestOptions = {
            config: {
                category: {
                    shop_by_price: true,
                    products: {
                        limit: productsPerPage,
                    },
                },
            },
            template: {
                productListing: 'category/product-listing',
                sidebar: 'category/sidebar',
            },
            showMore: 'category/show-more',
        };

        this.facetedSearch = new FacetedSearch(requestOptions, (content) => {
            $productListingContainer.html(content.productListing);
            $facetedSearchContainer.html(content.sidebar);

            $('body').triggerHandler('compareReset');

            $('html, body').animate({
                scrollTop: 0,
            }, 100);
        }, {
            validationErrorMessages: {
                onMinPriceError,
                onMaxPriceError,
                minPriceNotEntered,
                maxPriceNotEntered,
                onInvalidPrice,
            },
        });
    }

    initCategoryCartButtons() {
        // Click listener for "Add All to Cart" button
        $('[data-category-products]').on('click', (event) => {
            const categoryProducts = $(event.currentTarget).data('categoryProducts');
            // For each product in category, create an add to cart api request promise
            const addPromises = categoryProducts.map(product => new Promise((resolve) => {
                $.get(product.add_to_cart_url).then(() => resolve());
            }));

            Promise.all(addPromises).then(() => {
                // Update the cart pill count
                api.cart.getCartQuantity({}, (_, quantity) => {
                    $('body').trigger('cart-quantity-update', quantity);
                    // Notify user that items were added to cart
                    swal.fire({
                        text: 'Added all items to cart.',
                        icon: 'success',
                    });
                });
            });
        });

        // Register click event handler for category clear cart button
        $('#clear-cart-button').on('click', () => {
            // Function for making DELETE request to storefront api
            const deleteCart = (id) => {
                $.ajax({
                    url: `/api/storefront/carts/${id}`,
                    method: 'DELETE',
                }).then(() => {
                    $('body').trigger('cart-quantity-update', 0);
                    // Inform user that it was successful
                    swal.fire({
                        text: 'Removed all items from cart.',
                        icon: 'info',
                    });
                });
            };

            // Relying on the cartId in this.context is iffy at best.
            // Instead, call the api directly to get the cartId
            api.cart.getCart({}, (_, response) => {
                if (!response) return; // No cart exists
                deleteCart(response.id);
            });
        });

        // Register listener for cart-quantity-update event so clear cart button can be adjusted
        $('body').on('cart-quantity-update', (event, quantity) => {
            if (quantity <= 0) {
                $('#clear-cart-button').css('display', 'none');
            } else {
                $('#clear-cart-button').css('display', 'inline-block');
            }
        });
    }
}
