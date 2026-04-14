-- Migration: add sort_order to categories and subcategories
-- Run this if you already have the tables from database.sql

alter table categories    add column if not exists sort_order integer not null default 0;
alter table subcategories add column if not exists sort_order integer not null default 0;