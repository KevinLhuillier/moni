-- Moni : épargne (1/2)
-- Nouveau type de transaction pour l'argent mis de côté. Séparé de la migration
-- suivante : une valeur d'enum ne peut pas être utilisée dans la transaction qui l'ajoute.

alter type public.transaction_type add value if not exists 'saving';
