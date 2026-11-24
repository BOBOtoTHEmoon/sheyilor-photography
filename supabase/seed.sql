-- Sheyilor Photography: starting content
-- Run after schema.sql. Safe to run once on an empty database.
-- Portrait prices, fees and terms come from the 2026 Portrait Rate Card.

insert into settings (id) values (1) on conflict (id) do nothing;

-- Session types ---------------------------------------------------------------
insert into session_types (slug, name, tagline, description, rate_card_url, notes, terms, has_logistics, has_express, full_day, ready, sort) values
('portrait', 'Portrait session', 'Birthday, celebration, glamour, editorial and family portraits',
 'Studio portraits at Sheyilor Studio, or on location anywhere in Lagos.', null,
 array[
   'Prices are for sessions at Sheyilor Studio. Logistics are extra for anywhere else.',
   'Photos are delivered in 2 working days.',
   'Extra images are ₦15,000 each.',
   'A lateness fee of ₦10,000 per hour applies after 30 minutes.',
   'Payment confirms your booking.'
 ],
 '[
   {"title":"Payment validates booking","body":"Your date and session slot are reserved once payment is confirmed."},
   {"title":"Delivery time","body":"Photos are delivered in 2 working days. Express delivery costs ₦35,000 extra."},
   {"title":"Extra selections","body":"Retouched images beyond your package are ₦15,000 each."},
   {"title":"Logistics","body":"Extra charges apply to all outdoor and on-location sessions outside Sheyilor Studio."},
   {"title":"Lateness","body":"After 30 minutes of lateness, a fee of ₦10,000 per hour applies."},
   {"title":"Refunds","body":"No refunds after 48 hours of booking. You can transfer your shoot to someone else who accepts these terms."}
 ]'::jsonb, true, true, false, true, 1),
('wedding', 'Wedding', 'Full coverage for 2026 and 2027, with optional pre-wedding shoots', '', null, '{}', '[]', false, false, true, false, 2),
('event', 'Event coverage', 'Parties, launches and celebrations', '', null, '{}', '[]', false, false, false, false, 3),
('fashion', 'Fashion collection', 'Lookbooks and campaigns for brands and designers', '', null, '{}', '[]', false, false, false, false, 4),
('convocation', 'Convocation', 'Graduation and call to bar portraits', '', null, '{}', '[]', false, false, false, false, 5),
('training', 'Photography training', 'Programs for beginners and growing photographers', '', null, '{}', '[]', false, false, false, false, 6)
on conflict (slug) do nothing;

-- Portrait packages ------------------------------------------------------------
insert into packages (session_type_id, name, subtitle, price, per_outfit, images_included, included, highlight, sort)
select id, 'Portraits', 'For every kind of solo portrait', 100000, true, 4,
 '[
   {"title":"1 outfit or look","detail":"One complete styled outfit or look for your studio session."},
   {"title":"4 edited images","detail":"High-resolution retouched photos, delivered in 2 working days."},
   {"title":"45-minute studio session","detail":"At Sheyilor Studio, with lighting set up for you and coaching throughout."},
   {"title":"Extra images","detail":"More retouched photos at ₦15,000 each."}
 ]'::jsonb, false, 1
from session_types where slug = 'portrait';

insert into packages (session_type_id, name, subtitle, price, per_outfit, images_included, included, highlight, sort)
select id, 'Family or group', 'More than one person in the photo', 150000, true, 5,
 '[
   {"title":"Families, couples and teams","detail":"For family, couple, group or team portraits."},
   {"title":"5 edited images","detail":"Retouched photos of the whole group, delivered in 2 working days."},
   {"title":"1-hour studio session per outfit","detail":"Custom staging and help arranging everyone in the shot."},
   {"title":"Extra images","detail":"More retouched photos at ₦15,000 each."}
 ]'::jsonb, true, 2
from session_types where slug = 'portrait';

-- Booking page photos (change them any time in the dashboard)
update session_types set cover_url = v.url
from (values ('portrait','/images/studio-portrait.jpg'),('wedding','/images/celebration.jpg'),('event','/images/studio-classic.jpg'),
             ('fashion','/images/art-direction.jpg'),('convocation','/images/solo-editorial.jpg'),('training','/images/glamour.jpg')) as v(slug, url)
where session_types.slug = v.slug;

-- Portrait logistics and extras ----------------------------------------------------
insert into logistics_fees (session_type_id, kind, area, fee, sort)
select st.id, v.kind, v.area, v.fee, v.sort
from session_types st,
 (values ('outdoor','Mainland',40000,1),('outdoor','Ikoyi / Lekki',50000,2),('outdoor','Lekki 2 / Ajah',70000,3),
         ('home','Mainland',70000,4),('home','VI / Ikoyi',85000,5),('home','Lekki / Lekki 2',105000,6)) as v(kind, area, fee, sort)
where st.slug = 'portrait';

insert into extras (session_type_id, name, price, unit, sort)
select st.id, v.name, v.price, v.unit, v.sort
from session_types st,
 (values ('Extra edited image',15000,'each',1),('Express delivery',35000,'',2),('Lateness, after 30 minutes',10000,'per hour',3)) as v(name, price, unit, sort)
where st.slug = 'portrait';

-- Booking form questions ---------------------------------------------------------------
insert into form_fields (session_type_id, label, field_type, role, options, placeholder, required, sort)
select st.id, v.label, v.field_type, v.role, v.options, v.placeholder, v.required, v.sort
from session_types st
join (values
  ('portrait','Full name','text','name',array[]::text[],null,true,1),
  ('portrait','Email (for your invoice)','email','email',array[]::text[],null,true,2),
  ('portrait','Phone or WhatsApp','tel','phone',array[]::text[],null,true,3),
  ('portrait','Type of portrait','choice',null,array['Birthday','Celebration','Glamour','Editorial','Family or group','Headshot','Other'],null,true,4),
  ('wedding','Couple name','text','name',array[]::text[],'Tolu & Dami',true,1),
  ('wedding','Wedding hashtag','text',null,array[]::text[],'#TD2026',false,2),
  ('wedding','Email','email','email',array[]::text[],null,true,3),
  ('wedding','Bride contact','tel','phone',array[]::text[],null,true,4),
  ('wedding','Wedding location','text',null,array[]::text[],'Venue and city',true,5),
  ('wedding','Pre-wedding shoot date','date',null,array[]::text[],null,false,6),
  ('wedding','Pre-wedding shoot time','time',null,array[]::text[],null,false,7),
  ('wedding','Pre-wedding outfits','number',null,array[]::text[],null,false,8),
  ('event','Full name','text','name',array[]::text[],null,true,1),
  ('event','Email','email','email',array[]::text[],null,true,2),
  ('event','Phone or WhatsApp','tel','phone',array[]::text[],null,true,3),
  ('event','Type of event','text',null,array[]::text[],'e.g. 50th birthday',true,4),
  ('event','Event location','text',null,array[]::text[],'Venue and city',true,5),
  ('fashion','Name or brand','text','name',array[]::text[],null,true,1),
  ('fashion','Email','email','email',array[]::text[],null,true,2),
  ('fashion','Phone or WhatsApp','tel','phone',array[]::text[],null,true,3),
  ('fashion','Number of outfits','number',null,array[]::text[],null,true,4),
  ('fashion','Location','text',null,array[]::text[],'Studio or your location',true,5),
  ('convocation','Full name','text','name',array[]::text[],null,true,1),
  ('convocation','Email','email','email',array[]::text[],null,true,2),
  ('convocation','Phone or WhatsApp','tel','phone',array[]::text[],null,true,3),
  ('convocation','School or institution','text',null,array[]::text[],null,true,4),
  ('convocation','Number of outfits','number',null,array[]::text[],null,true,5),
  ('training','Full name','text','name',array[]::text[],null,true,1),
  ('training','Email','email','email',array[]::text[],null,true,2),
  ('training','Phone or WhatsApp','tel','phone',array[]::text[],null,true,3),
  ('training','Program you are interested in','text',null,array[]::text[],null,true,4)
) as v(type_slug, label, field_type, role, options, placeholder, required, sort) on v.type_slug = st.slug;

-- Portfolio ----------------------------------------------------------------------
insert into collections (slug, name, description, cta_label, session_type_slug, cover_url, sort) values
('birthday', 'Birthday', 'Milestone birthday portraits, styled your way, at the studio or on location.', 'Book a birthday shoot', 'portrait', '/images/glamour.jpg', 1),
('celebrity', 'Celebrity', 'Portraits for artists, creators and public figures.', 'Book a portrait session', 'portrait', '/images/solo-editorial.jpg', 2),
('weddings', 'Weddings', 'The vows, the dancing and every small moment in between.', 'Book your wedding date', 'wedding', null, 3),
('pre-wedding', 'Pre wedding', 'Relaxed couple shoots before the big day.', 'Book a pre-wedding shoot', 'wedding', null, 4),
('fashion', 'Fashion', 'Lookbooks and campaigns for brands and designers.', 'Book a fashion shoot', 'fashion', null, 5),
('maternity', 'Maternity', 'Calm, beautiful sessions celebrating motherhood.', 'Book a maternity shoot', 'portrait', null, 6),
('family', 'Family', 'Portraits of the whole family, little ones included.', 'Book a family shoot', 'portrait', null, 7),
('convocation', 'Convocation', 'Graduation portraits on campus or in the studio.', 'Book a convocation shoot', 'convocation', null, 8),
('call-to-bar', 'Call to bar', 'Portraits for the day you are called to the bar.', 'Book a call to bar shoot', 'convocation', null, 9),
('events', 'Events', 'Candid coverage of parties, launches and celebrations.', 'Book event coverage', 'event', null, 10)
on conflict (slug) do nothing;

insert into photos (collection_id, url, alt, width, height, sort)
select c.id, v.url, v.alt, 784, 1000, v.sort
from collections c
join (values
  ('birthday','/images/glamour.jpg','Woman in a lilac gown on a staircase under a chandelier',1),
  ('birthday','/images/celebration.jpg','Woman in a green lace outfit and gele holding a clutch',2),
  ('birthday','/images/studio-portrait.jpg','Woman in a red dress seated against a red backdrop',3),
  ('celebrity','/images/solo-editorial.jpg','Woman in a pink gown with a fan of light behind her',1),
  ('celebrity','/images/art-direction.jpg','Woman in a white hijab and gown beside a crescent moon',2),
  ('celebrity','/images/studio-classic.jpg','Woman in a purple lace dress seated on a stool',3)
) as v(slug, url, alt, sort) on v.slug = c.slug;

-- Homepage ----------------------------------------------------------------------
insert into home_items (section, position, image_url, alt, caption, collection_slug) values
('hero', 1, '/images/studio-portrait.jpg', 'Woman in a red dress seated against a red backdrop', 'Studio portrait', 'birthday'),
('hero', 2, '/images/celebration.jpg', 'Woman in a green lace outfit and gele holding a clutch', 'Celebration', 'birthday'),
('hero', 3, '/images/glamour.jpg', 'Woman in a lilac gown on a staircase under a chandelier', 'Glamour', 'birthday'),
('hero', 4, '/images/solo-editorial.jpg', 'Woman in a pink gown with a fan of light behind her', 'Solo editorial', 'celebrity'),
('hero', 5, '/images/studio-classic.jpg', 'Woman in a purple lace dress seated on a stool', 'Studio classic', 'celebrity'),
('hero', 6, '/images/art-direction.jpg', 'Woman in a white hijab and gown beside a crescent moon', 'Art direction', 'celebrity'),
('featured', 1, '/images/solo-editorial.jpg', 'Woman in a pink gown with a fan of light behind her', 'Solo editorial', 'celebrity'),
('featured', 2, '/images/art-direction.jpg', 'Woman in a white hijab and gown beside a crescent moon', 'Art direction', 'celebrity'),
('featured', 3, '/images/studio-classic.jpg', 'Woman in a purple lace dress seated on a stool', 'Studio classic', 'celebrity'),
('featured', 4, '/images/celebration.jpg', 'Woman in a green lace outfit and gele holding a clutch', 'Celebration', 'birthday'),
('featured', 5, '/images/glamour.jpg', 'Woman in a lilac gown under a chandelier', 'Glamour', 'birthday');

insert into testimonials (name, context, quote, sort) values
('Adebayo Ogunleye', 'Wedding', 'He captured every special moment of our wedding with such artistry and emotion.', 1),
('Chioma Okonkwo', 'Portrait session', 'I was nervous at first, but he made me feel completely at ease.', 2);
