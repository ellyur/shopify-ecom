INSERT INTO order_items (id, order_id, product_id, product_name, product_price, quantity, subtotal, product_image)
VALUES
(11, 12, 46, '1 dozen Rose', 899.00, 1, 899.00, 'https://res.cloudinary.com/dzk840qjn/image/upload/v1772019245/6122850414941114225_al50bu.jpg'),
(12, 13, 82, 'RED ROSES BOUQUET', 2500.00, 1, 2500.00, 'https://res.cloudinary.com/dzk840qjn/image/upload/v1772185118/6127488051907858037_bfez8z.jpg'),
(24, 23, 48, '2 dozen rose', 1200.00, 1, 1200.00, 'https://res.cloudinary.com/dzk840qjn/image/upload/v1772019513/6122850414941114246_alpagl.jpg')
ON CONFLICT (id) DO UPDATE SET order_id = EXCLUDED.order_id, product_id = EXCLUDED.product_id, product_name = EXCLUDED.product_name, product_price = EXCLUDED.product_price, quantity = EXCLUDED.quantity, subtotal = EXCLUDED.subtotal, product_image = EXCLUDED.product_image;