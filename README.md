### Notes:

- I created the "Special Items" category and the "Special Item" directly from the online dashboard.

- In order to show a product's second image on hover, I added a second `responseive-img` component in the `card` component. This component is only rendered if the product has more than one image. This second `responsive-img` has an opacity of 0 until hovered over.

- For the cart buttons that add and remove all items from a category, I created two button components. The "Add all" button is assigned the products of a category through the custom `data-category-products` data attribute. 
    - In `category.js`, I registered various event handlers which make the necessary calls to the bigcommerce api. 
    
    - I also added logic to update the cart count pill when items are added or removed from the cart. Even though the quantity count updates after a reload or redirect, it bothered me enough to ensure it updates correctly.

- For the bonus, I created a banner in the bigcommerce online dashboard. The content of the banner is a simple empty `<div>` with the id of `#customer-banner`. I understand that it is possible to create a banner through `api.bigcommerce.com` endpoint. However, this was not possible during local development due to CORS restrictions. 

    - I injected the `customer` context variable in the `category` page. This made it accessible through `this.context` in `category.js`. 
    
    - I added some simple logic in `category.js` to only display the banner when the `customer` context variable is not null (i.e. customer is logged in).

    - I don't think this was the most elegant solution and would have enjoyed spending more time on it.
