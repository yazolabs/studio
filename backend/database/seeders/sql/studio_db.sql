-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: studio-db-wkoccokcs4ggsw44wo0s880g-113220753252
-- Tempo de geração: 23-Jan-2026 às 18:04
-- Versão do servidor: 8.0.44
-- versão do PHP: 8.4.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de dados: `studio`
--

-- --------------------------------------------------------

--
-- Estrutura da tabela `accounts_payable`
--

CREATE TABLE `accounts_payable` (
  `id` bigint UNSIGNED NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `due_date` date DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `category` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `supplier_id` bigint UNSIGNED DEFAULT NULL,
  `professional_id` bigint UNSIGNED DEFAULT NULL,
  `appointment_id` bigint UNSIGNED DEFAULT NULL,
  `payment_date` date DEFAULT NULL,
  `payment_method` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference` varchar(160) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Extraindo dados da tabela `accounts_payable`
--

INSERT INTO `accounts_payable` (`id`, `description`, `amount`, `due_date`, `status`, `category`, `supplier_id`, `professional_id`, `appointment_id`, `payment_date`, `payment_method`, `reference`, `notes`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 'Conta de Luz', 953.79, '2025-12-01', 'pending', 'Neo energia', NULL, NULL, NULL, NULL, NULL, NULL, 'urgência', '2025-11-25 18:40:28', '2025-12-03 10:24:58', '2025-12-03 10:24:58'),
(2, 'Aluguel', 650.00, '2025-11-30', 'pending', 'Studio', NULL, NULL, NULL, NULL, NULL, NULL, 'não esquecer', '2025-11-25 18:42:00', '2025-12-03 10:25:02', '2025-12-03 10:25:02'),
(3, 'Divulgação', 60.00, '2025-11-25', 'paid', 'Mangabeira ordinario', NULL, NULL, NULL, '2025-11-25', NULL, NULL, 'pago', '2025-11-25 18:45:14', '2025-12-03 10:25:58', '2025-12-03 10:25:58'),
(4, 'Compra de cabelo', 164.00, '2025-11-25', 'paid', 'Negros trançados', NULL, NULL, NULL, '2025-11-25', NULL, NULL, 'pago', '2025-11-25 18:47:55', '2025-12-03 10:26:02', '2025-12-03 10:26:02'),
(5, 'Amolar alicate', 25.00, '2025-11-25', 'paid', 'Alicates', NULL, NULL, NULL, '2025-11-25', NULL, NULL, 'pago', '2025-11-25 18:49:07', '2025-12-03 10:26:06', '2025-12-03 10:26:06'),
(6, 'Pagamento Funcionario', 6300.00, '2025-11-30', 'pending', 'quinzena de todos', NULL, NULL, NULL, NULL, NULL, NULL, 'pagar', '2025-11-25 18:51:54', '2025-12-03 10:25:06', '2025-12-03 10:25:06'),
(7, 'café açucar', 18.43, '2025-11-26', 'paid', 'supermercado', NULL, NULL, NULL, '2025-11-26', NULL, NULL, 'pago', '2025-11-26 11:33:47', '2025-12-03 10:25:39', '2025-12-03 10:25:39'),
(8, 'balões de festa', 34.50, '2025-11-26', 'paid', 'casa de festa', NULL, NULL, NULL, '2025-11-26', NULL, NULL, NULL, '2025-11-26 11:37:13', '2025-12-03 10:25:43', '2025-12-03 10:25:43'),
(9, 'produto de sobrancelhas', 25.00, '2025-11-26', 'paid', 'loja 10', NULL, NULL, NULL, '2025-11-26', NULL, NULL, NULL, '2025-11-26 11:38:27', '2025-12-03 10:25:47', '2025-12-03 10:25:47'),
(10, 'tinta para pinta o muro', 84.78, '2025-11-25', 'paid', 'ferreira costa', NULL, NULL, NULL, '2025-11-26', NULL, NULL, 'pago', '2025-11-26 11:44:29', '2025-12-03 10:26:09', '2025-12-03 10:26:09'),
(11, 'serviço de pintura', 200.00, '2025-11-26', 'paid', 'Sr Rafael', NULL, NULL, NULL, '2025-11-26', NULL, NULL, NULL, '2025-11-26 11:45:34', '2025-12-03 10:25:52', '2025-12-03 10:25:52'),
(12, 'Comissão: Design com Henna', 14.00, '2025-12-03', 'pending', 'Comissões', NULL, 3, 3, NULL, NULL, 'APP-3-SRV-62', NULL, '2025-11-26 13:29:20', '2025-12-03 10:24:51', '2025-12-03 10:24:51'),
(13, 'Comissão: Gel manutenção (Tip)', 32.00, '2025-12-03', 'pending', 'Comissões', NULL, 10, 4, NULL, NULL, 'APP-4-SRV-69', NULL, '2025-11-26 14:24:21', '2025-12-03 10:24:46', '2025-12-03 10:24:46'),
(14, 'paraíba aguá ', 15.00, '2025-11-27', 'pending', 'aguá mineral ', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-11-26 17:46:02', '2025-11-27 09:45:46', '2025-11-27 09:45:46'),
(15, 'paraíba aguá ', 15.00, '2025-11-27', 'paid', 'aguá mineral ', NULL, NULL, NULL, '2025-11-26', NULL, NULL, NULL, '2025-11-26 17:46:02', '2025-12-03 10:25:13', '2025-12-03 10:25:13'),
(16, 'paraíba aguá ', 15.00, '2025-11-27', 'pending', 'aguá mineral ', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-11-26 17:46:02', '2025-11-27 09:45:57', '2025-11-27 09:45:57'),
(17, 'Comissão: combo promocional Cilios+sobrancelhas', 40.00, '2025-12-03', 'pending', 'Comissões', NULL, 3, 6, NULL, NULL, 'APP-6-SRV-87', NULL, '2025-11-26 18:20:50', '2025-12-03 10:24:54', '2025-12-03 10:24:54'),
(18, 'Comissão: progressiva Aminoacido  tamanho (M)', 68.00, '2025-12-03', 'pending', 'Comissões', NULL, 2, 5, NULL, NULL, 'APP-5-SRV-3', NULL, '2025-11-26 18:27:18', '2025-12-03 10:25:32', '2025-12-03 10:25:32'),
(19, 'Comissão: Gel manutenção (Tip)', 32.00, '2025-12-03', 'pending', 'Comissões', NULL, 10, 5, NULL, NULL, 'APP-5-SRV-69', NULL, '2025-11-26 18:27:19', '2025-12-03 10:25:35', '2025-12-03 10:25:35'),
(20, 'Comissão: Pé e mão ', 20.00, '2025-12-03', 'pending', 'Comissões', NULL, 2, 5, NULL, NULL, 'APP-5-SRV-78', NULL, '2025-11-26 18:27:19', '2025-12-03 10:25:29', '2025-12-03 10:25:29'),
(21, 'Comissão: Gel manutenção (Tip)', 32.00, '2025-12-03', 'pending', 'Comissões', NULL, 8, 1, NULL, NULL, 'APP-1-SRV-69', NULL, '2025-11-26 18:30:11', '2025-12-03 10:25:24', '2025-12-03 10:25:24'),
(22, 'Comissão: Gel manutenção (Tip)', 32.00, '2025-12-03', 'pending', 'Comissões', NULL, 8, 8, NULL, NULL, 'APP-8-SRV-69', NULL, '2025-11-26 18:34:57', '2025-12-03 10:25:20', '2025-12-03 10:25:20'),
(23, 'Comissão: Gel manutenção (Tip)', 32.00, '2026-01-26', 'pending', 'Comissões', NULL, 4, 36, NULL, NULL, 'APP-36-SRV-69', NULL, '2026-01-19 16:22:31', '2026-01-19 16:22:31', NULL),
(24, 'Comissão: Gel manutenção (Tip)', 32.00, '2026-01-26', 'pending', 'Comissões', NULL, 4, 37, NULL, NULL, 'APP-37-SRV-69', NULL, '2026-01-19 16:23:16', '2026-01-19 16:23:16', NULL),
(25, 'Comissão: Pé e mão ', 20.00, '2026-01-26', 'pending', 'Comissões', NULL, 2, 37, NULL, NULL, 'APP-37-SRV-78', NULL, '2026-01-19 16:23:16', '2026-01-19 16:23:16', NULL),
(26, 'Comissão: Combo pé e mao + plastica dos pés ou Spa dos pés', 32.00, '2026-01-26', 'pending', 'Comissões', NULL, 2, 38, NULL, NULL, 'APP-38-SRV-85', NULL, '2026-01-19 16:23:53', '2026-01-19 16:23:53', NULL),
(27, 'Comissão: luzes (Mechas) tamanho (M)', 0.00, '2026-01-26', 'pending', 'Comissões', NULL, 1, 39, NULL, NULL, 'APP-39-SRV-45', NULL, '2026-01-19 16:24:58', '2026-01-19 16:24:58', NULL),
(28, 'Comissão: Cronograma Grati completo (M)', 110.00, '2026-01-26', 'pending', 'Comissões', NULL, 1, 39, NULL, NULL, 'APP-39-SRV-132', NULL, '2026-01-19 16:24:58', '2026-01-19 16:24:58', NULL),
(29, 'Comissão: Progressiva formol tamanho (M)', 72.00, '2026-01-26', 'pending', 'Comissões', NULL, 1, 42, NULL, NULL, 'APP-42-SRV-31', NULL, '2026-01-19 16:25:19', '2026-01-19 16:25:19', NULL),
(30, 'Comissão: Designer de corte', 20.00, '2026-01-27', 'pending', 'Comissões', NULL, 1, 43, NULL, NULL, 'APP-43-SRV-1', NULL, '2026-01-20 08:25:21', '2026-01-20 08:25:21', NULL),
(31, 'Comissão: Gel manutenção (Tip)', 32.00, '2026-01-28', 'pending', 'Comissões', NULL, 10, 50, NULL, NULL, 'APP-50-SRV-69', NULL, '2026-01-21 15:17:32', '2026-01-21 15:17:32', NULL),
(32, 'Comissão: Gel manutenção (Tip)', 32.00, '2026-01-28', 'pending', 'Comissões', NULL, 10, 51, NULL, NULL, 'APP-51-SRV-69', NULL, '2026-01-21 15:17:59', '2026-01-21 15:17:59', NULL),
(33, 'Comissão: Cronograma Grati 2 seção  (M)', 22.00, '2026-01-28', 'pending', 'Comissões', NULL, 1, 63, NULL, NULL, 'APP-63-SRV-95', NULL, '2026-01-21 15:50:11', '2026-01-21 15:50:11', NULL);

-- --------------------------------------------------------

--
-- Estrutura da tabela `actions`
--

CREATE TABLE `actions` (
  `id` bigint UNSIGNED NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Extraindo dados da tabela `actions`
--

INSERT INTO `actions` (`id`, `name`, `slug`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 'Criar', 'create', '2025-11-23 02:18:55', '2025-11-23 02:18:55', NULL),
(2, 'Visualizar', 'read', '2025-11-23 02:18:55', '2025-11-23 02:18:55', NULL),
(3, 'Atualizar', 'update', '2025-11-23 02:18:55', '2025-11-23 02:18:55', NULL),
(4, 'Excluir', 'delete', '2025-11-23 02:18:55', '2025-11-23 02:18:55', NULL);

-- --------------------------------------------------------

--
-- Estrutura da tabela `appointments`
--

CREATE TABLE `appointments` (
  `id` bigint UNSIGNED NOT NULL,
  `customer_id` bigint UNSIGNED NOT NULL,
  `date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time DEFAULT NULL,
  `duration` int UNSIGNED NOT NULL DEFAULT '0',
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payment_status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'unpaid',
  `total_price` decimal(12,2) NOT NULL DEFAULT '0.00',
  `discount_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `discount_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'percentage',
  `final_price` decimal(12,2) NOT NULL DEFAULT '0.00',
  `promotion_id` bigint UNSIGNED DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Extraindo dados da tabela `appointments`
--

INSERT INTO `appointments` (`id`, `customer_id`, `date`, `start_time`, `end_time`, `duration`, `status`, `payment_status`, `total_price`, `discount_amount`, `discount_type`, `final_price`, `promotion_id`, `notes`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, '2025-11-26', '16:00:00', '18:30:11', 120, 'completed', 'unpaid', 80.00, 0.00, 'percentage', 80.00, NULL, 'Promoção Campanha', '2025-11-26 13:22:26', '2025-12-03 10:27:11', '2025-12-03 10:27:11'),
(2, 2, '2025-11-26', '18:00:00', NULL, 120, 'scheduled', 'unpaid', 80.00, 0.00, 'percentage', 80.00, NULL, NULL, '2025-11-26 13:27:50', '2025-12-03 10:27:14', '2025-12-03 10:27:14'),
(3, 5, '2025-11-26', '11:00:00', '13:29:20', 30, 'completed', 'unpaid', 35.00, 0.00, 'percentage', 35.00, NULL, NULL, '2025-11-26 13:28:52', '2025-12-03 10:26:55', '2025-12-03 10:26:55'),
(4, 3, '2025-11-26', '13:00:00', '14:24:21', 120, 'completed', 'unpaid', 80.00, 0.00, 'percentage', 80.00, NULL, NULL, '2025-11-26 13:30:06', '2025-12-03 10:26:58', '2025-12-03 10:26:58'),
(5, 4, '2025-11-26', '15:00:00', '18:27:18', 330, 'completed', 'unpaid', 350.00, 0.00, 'percentage', 350.00, NULL, NULL, '2025-11-26 13:37:10', '2025-12-03 10:27:07', '2025-12-03 10:27:07'),
(6, 6, '2025-11-26', '13:00:00', '18:20:50', 120, 'completed', 'unpaid', 100.00, 0.00, 'percentage', 100.00, NULL, 'Combo promocinal', '2025-11-26 13:41:13', '2025-12-03 10:27:00', '2025-12-03 10:27:00'),
(7, 7, '2025-11-26', '14:00:00', NULL, 120, 'scheduled', 'unpaid', 80.00, 0.00, 'percentage', 80.00, NULL, 'cliente chegara depois do horario', '2025-11-26 13:57:22', '2025-11-26 13:58:19', '2025-11-26 13:58:19'),
(8, 7, '2025-11-26', '14:00:00', '18:34:57', 150, 'completed', 'unpaid', 100.00, 0.00, 'percentage', 100.00, NULL, 'cliente chegara depois do horario', '2025-11-26 13:57:22', '2025-12-03 10:27:03', '2025-12-03 10:27:03'),
(9, 4, '2025-11-26', '15:00:00', NULL, 180, 'scheduled', 'unpaid', 130.00, 0.00, 'percentage', 130.00, NULL, NULL, '2025-11-26 14:19:47', '2025-11-26 18:25:25', '2025-11-26 18:25:25'),
(10, 8, '2025-11-27', '09:00:00', NULL, 330, 'scheduled', 'unpaid', 345.00, 0.00, 'percentage', 345.00, NULL, NULL, '2025-11-26 15:52:28', '2025-11-26 16:27:35', '2025-11-26 16:27:35'),
(11, 8, '2025-11-27', '09:00:00', NULL, 330, 'scheduled', 'unpaid', 345.00, 0.00, 'percentage', 345.00, NULL, NULL, '2025-11-26 15:52:28', '2025-12-03 10:26:41', '2025-12-03 10:26:41'),
(12, 57, '2025-12-03', '14:00:00', '16:00:00', 120, 'scheduled', 'unpaid', 80.00, 0.00, 'percentage', 80.00, NULL, 'cliente pegou a promoção 50,00', '2025-12-03 10:33:27', '2026-01-19 08:53:11', '2026-01-19 08:53:11'),
(13, 29, '2025-12-03', '12:00:00', '13:00:00', 60, 'scheduled', 'unpaid', 50.00, 0.00, 'percentage', 50.00, NULL, NULL, '2025-12-03 10:36:41', '2026-01-19 08:52:46', '2026-01-19 08:52:46'),
(14, 103, '2025-12-03', '17:00:00', '18:00:00', 60, 'scheduled', 'unpaid', 50.00, 0.00, 'percentage', 50.00, NULL, NULL, '2025-12-03 10:39:20', '2026-01-19 08:52:53', '2026-01-19 08:52:53'),
(15, 43, '2025-12-03', '11:00:00', '11:30:00', 30, 'scheduled', 'unpaid', 35.00, 0.00, 'percentage', 35.00, NULL, 'cliente pegou promoção por 25,00', '2025-12-03 10:41:02', '2026-01-19 08:52:42', '2026-01-19 08:52:42'),
(16, 114, '2025-12-03', '15:00:00', '15:30:00', 30, 'scheduled', 'unpaid', 70.00, 0.00, 'percentage', 70.00, NULL, NULL, '2025-12-03 10:44:05', '2026-01-19 08:52:50', '2026-01-19 08:52:50'),
(17, 114, '2025-12-03', '15:30:00', '16:00:00', 30, 'scheduled', 'unpaid', 35.00, 0.00, 'percentage', 35.00, NULL, NULL, '2025-12-03 10:48:04', '2026-01-19 08:53:08', '2026-01-19 08:53:08'),
(18, 114, '2025-12-03', '16:30:00', '17:00:00', 30, 'scheduled', 'unpaid', 70.00, 0.00, 'percentage', 70.00, NULL, NULL, '2025-12-03 10:51:11', '2025-12-03 10:51:55', '2025-12-03 10:51:55'),
(19, 114, '2025-12-03', '13:30:00', '14:00:00', 30, 'scheduled', 'unpaid', 70.00, 0.00, 'percentage', 70.00, NULL, NULL, '2025-12-03 10:57:31', '2025-12-03 10:59:03', '2025-12-03 10:59:03'),
(20, 114, '2025-12-03', '13:30:00', '14:00:00', 30, 'scheduled', 'unpaid', 70.00, 0.00, 'percentage', 70.00, NULL, NULL, '2025-12-03 10:57:31', '2025-12-03 10:57:44', '2025-12-03 10:57:44'),
(21, 104, '2025-12-04', '17:50:00', '19:50:00', 120, 'scheduled', 'unpaid', 165.00, 0.00, 'percentage', 165.00, NULL, NULL, '2025-12-03 12:21:50', '2026-01-19 08:52:57', '2026-01-19 08:52:57'),
(22, 115, '2025-12-04', '18:00:00', '19:00:00', 60, 'scheduled', 'unpaid', 55.00, 0.00, 'percentage', 55.00, NULL, 'já pago', '2025-12-03 12:51:40', '2026-01-19 08:53:01', '2026-01-19 08:53:01'),
(23, 110, '2025-12-04', '13:00:00', '14:00:00', 60, 'scheduled', 'unpaid', 50.00, 0.00, 'percentage', 50.00, NULL, NULL, '2025-12-03 12:57:39', '2026-01-19 08:53:05', '2026-01-19 08:53:05'),
(24, 102, '2025-12-06', '09:00:00', '11:00:00', 120, 'scheduled', 'unpaid', 80.00, 0.00, 'percentage', 80.00, NULL, NULL, '2025-12-03 12:59:01', '2026-01-19 08:53:26', '2026-01-19 08:53:26'),
(25, 116, '2025-12-05', '16:30:00', '18:30:00', 120, 'scheduled', 'unpaid', 80.00, 0.00, 'percentage', 80.00, NULL, NULL, '2025-12-03 13:01:48', '2026-01-19 08:53:19', '2026-01-19 08:53:19'),
(26, 117, '2025-12-06', '17:00:00', '18:00:00', 60, 'scheduled', 'unpaid', 55.00, 0.00, 'percentage', 55.00, NULL, NULL, '2025-12-03 13:05:01', '2026-01-19 08:54:03', '2026-01-19 08:54:03'),
(27, 50, '2025-12-06', '14:00:00', '16:00:00', 120, 'scheduled', 'unpaid', 80.00, 0.00, 'percentage', 80.00, NULL, NULL, '2025-12-03 13:08:32', '2026-01-19 08:53:52', '2026-01-19 08:53:52'),
(28, 118, '2025-12-06', '09:00:00', '11:00:00', 120, 'scheduled', 'unpaid', 130.00, 0.00, 'percentage', 130.00, NULL, NULL, '2025-12-03 13:10:26', '2026-01-19 08:53:30', '2026-01-19 08:53:30'),
(29, 101, '2025-12-06', '16:00:00', '18:00:00', 120, 'scheduled', 'unpaid', 80.00, 0.00, 'percentage', 80.00, NULL, NULL, '2025-12-03 13:12:38', '2026-01-19 08:53:56', '2026-01-19 08:53:56'),
(30, 76, '2025-12-06', '13:00:00', '14:00:00', 60, 'scheduled', 'unpaid', 55.00, 0.00, 'percentage', 55.00, NULL, NULL, '2025-12-03 13:17:01', '2026-01-19 08:53:47', '2026-01-19 08:53:47'),
(31, 80, '2025-12-06', '16:00:00', '17:00:00', 60, 'scheduled', 'unpaid', 55.00, 0.00, 'percentage', 55.00, NULL, NULL, '2025-12-03 13:17:55', '2026-01-19 08:54:00', '2026-01-19 08:54:00'),
(32, 65, '2025-12-06', '09:00:00', '10:00:00', 60, 'scheduled', 'unpaid', 100.00, 0.00, 'percentage', 100.00, NULL, 'Jà pago', '2025-12-03 13:41:43', '2026-01-19 08:53:37', '2026-01-19 08:53:37'),
(33, 52, '2025-12-06', '10:00:00', '11:00:00', 60, 'scheduled', 'unpaid', 55.00, 0.00, 'percentage', 55.00, NULL, NULL, '2025-12-03 13:42:34', '2026-01-19 08:53:41', '2026-01-19 08:53:41'),
(34, 119, '2025-12-06', '11:00:00', '11:30:00', 30, 'scheduled', 'unpaid', 60.00, 0.00, 'percentage', 60.00, NULL, NULL, '2025-12-03 13:44:40', '2026-01-19 08:53:44', '2026-01-19 08:53:44'),
(35, 1, '2026-01-19', '17:00:00', '19:00:00', 120, 'scheduled', 'unpaid', 80.00, 0.00, 'percentage', 80.00, NULL, NULL, '2026-01-19 14:48:15', '2026-01-19 14:55:08', '2026-01-19 14:55:08'),
(36, 120, '2026-01-19', '14:00:00', '16:00:00', 120, 'completed', 'paid', 80.00, 10.00, 'fixed', 70.00, NULL, NULL, '2026-01-19 14:58:19', '2026-01-19 16:22:31', NULL),
(37, 121, '2026-01-19', '17:00:00', '19:00:00', 120, 'completed', 'paid', 130.00, 15.00, 'fixed', 115.00, NULL, NULL, '2026-01-19 15:01:29', '2026-01-19 16:23:16', NULL),
(38, 123, '2026-01-19', '13:00:00', '15:00:00', 120, 'completed', 'paid', 80.00, 5.00, 'fixed', 75.00, NULL, NULL, '2026-01-19 15:21:42', '2026-01-19 16:23:53', NULL),
(39, 8, '2026-01-19', '13:00:00', '19:00:00', 360, 'completed', 'paid', 675.00, 50.00, 'percentage', 337.50, NULL, NULL, '2026-01-19 15:23:47', '2026-01-19 16:24:58', NULL),
(42, 107, '2026-01-19', '19:00:00', '21:00:00', 120, 'completed', 'paid', 180.00, 10.00, 'fixed', 170.00, NULL, NULL, '2026-01-19 15:47:49', '2026-01-19 16:25:19', NULL),
(43, 122, '2026-01-19', '21:00:00', '21:30:00', 30, 'completed', 'paid', 50.00, 0.00, 'percentage', 50.00, NULL, NULL, '2026-01-19 15:48:48', '2026-01-20 08:25:21', NULL),
(44, 83, '2026-01-20', '09:00:00', '11:00:00', 120, 'scheduled', 'unpaid', 80.00, 0.00, 'percentage', 80.00, NULL, NULL, '2026-01-19 16:01:02', '2026-01-19 16:01:02', NULL),
(45, 45, '2026-01-20', '11:00:00', '13:00:00', 120, 'scheduled', 'unpaid', 80.00, 0.00, 'percentage', 80.00, NULL, NULL, '2026-01-19 16:02:28', '2026-01-19 16:02:28', NULL),
(46, 89, '2026-01-20', '14:00:00', '16:00:00', 120, 'scheduled', 'unpaid', 130.00, 0.00, 'percentage', 130.00, NULL, NULL, '2026-01-19 16:12:04', '2026-01-19 16:29:55', '2026-01-19 16:29:55'),
(47, 83, '2026-01-20', '09:00:00', '10:00:00', 60, 'scheduled', 'unpaid', 50.00, 0.00, 'percentage', 50.00, NULL, NULL, '2026-01-19 16:13:16', '2026-01-19 16:13:16', NULL),
(48, 125, '2026-01-20', '18:00:00', '20:00:00', 120, 'scheduled', 'unpaid', 80.00, 0.00, 'percentage', 80.00, NULL, NULL, '2026-01-19 16:21:42', '2026-01-19 16:21:42', NULL),
(49, 89, '2026-01-20', '14:00:00', '15:00:00', 60, 'scheduled', 'unpaid', 50.00, 0.00, 'percentage', 50.00, NULL, NULL, '2026-01-19 16:30:51', '2026-01-21 12:17:34', '2026-01-21 12:17:34'),
(50, 88, '2026-01-21', '09:00:00', '11:00:00', 120, 'completed', 'paid', 80.00, 0.00, 'percentage', 80.00, NULL, NULL, '2026-01-19 16:32:44', '2026-01-21 15:17:32', NULL),
(51, 93, '2026-01-21', '14:00:00', '16:00:00', 120, 'completed', 'paid', 80.00, 30.00, 'fixed', 50.00, NULL, NULL, '2026-01-19 16:33:27', '2026-01-21 15:17:59', NULL),
(52, 126, '2026-01-21', '16:00:00', '18:00:00', 120, 'scheduled', 'unpaid', 80.00, 0.00, 'percentage', 80.00, NULL, NULL, '2026-01-19 16:35:11', '2026-01-21 15:18:14', '2026-01-21 15:18:14'),
(53, 3, '2026-01-20', '12:00:00', '14:00:00', 120, 'scheduled', 'unpaid', 80.00, 0.00, 'percentage', 80.00, NULL, NULL, '2026-01-19 16:39:11', '2026-01-21 12:16:59', '2026-01-21 12:16:59'),
(54, 8, '2026-01-26', '13:00:00', '14:00:00', 60, 'scheduled', 'prepaid', 55.00, 0.00, 'percentage', 55.00, NULL, NULL, '2026-01-19 16:43:07', '2026-01-19 16:43:07', NULL),
(55, 128, '2026-01-22', '16:30:00', '18:30:00', 120, 'scheduled', 'unpaid', 60.00, 0.00, 'percentage', 60.00, NULL, NULL, '2026-01-21 12:20:37', '2026-01-21 12:20:37', NULL),
(56, 118, '2026-01-23', '10:00:00', '11:00:00', 60, 'scheduled', 'unpaid', 300.00, 0.00, 'percentage', 300.00, NULL, NULL, '2026-01-21 12:22:26', '2026-01-21 12:22:26', NULL),
(57, 49, '2026-01-24', '16:00:00', '18:00:00', 120, 'scheduled', 'unpaid', 80.00, 0.00, 'percentage', 80.00, NULL, NULL, '2026-01-21 12:32:36', '2026-01-21 12:32:36', NULL),
(58, 52, '2026-01-24', '09:00:00', '10:00:00', 60, 'scheduled', 'unpaid', 50.00, 0.00, 'percentage', 50.00, NULL, NULL, '2026-01-21 12:34:49', '2026-01-21 12:34:49', NULL),
(59, 130, '2026-01-24', '10:00:00', '11:00:00', 60, 'scheduled', 'unpaid', 60.00, 0.00, 'percentage', 60.00, NULL, NULL, '2026-01-21 12:39:13', '2026-01-21 12:39:13', NULL),
(60, 129, '2026-01-24', '14:00:00', '15:00:00', 60, 'scheduled', 'unpaid', 50.00, 0.00, 'percentage', 50.00, NULL, NULL, '2026-01-21 12:40:17', '2026-01-21 12:40:17', NULL),
(61, 131, '2026-01-26', '14:00:00', '16:00:00', 120, 'scheduled', 'unpaid', 170.00, 0.00, 'percentage', 170.00, NULL, 'OBS MÃE DE BIA', '2026-01-21 12:47:09', '2026-01-21 12:47:09', NULL),
(62, 2, '2026-01-21', '17:30:00', '19:30:00', 120, 'scheduled', 'unpaid', 80.00, 0.00, 'percentage', 80.00, NULL, NULL, '2026-01-21 15:41:01', '2026-01-21 15:42:23', '2026-01-21 15:42:23'),
(63, 8, '2026-01-23', '15:00:00', '16:00:00', 60, 'completed', 'paid', 55.00, 100.00, 'percentage', 0.00, NULL, 'CLIENTE PAGOU DESDE  A 1 SEÇÃO', '2026-01-21 15:49:13', '2026-01-21 15:50:11', NULL),
(64, 21, '2026-01-22', '11:30:00', '13:30:00', 120, 'scheduled', 'prepaid', 80.00, 0.00, 'percentage', 80.00, 2, NULL, '2026-01-22 09:30:06', '2026-01-22 10:25:53', NULL);

-- --------------------------------------------------------

--
-- Estrutura da tabela `appointment_item`
--

CREATE TABLE `appointment_item` (
  `id` bigint UNSIGNED NOT NULL,
  `appointment_id` bigint UNSIGNED NOT NULL,
  `item_id` bigint UNSIGNED NOT NULL,
  `price` decimal(12,2) NOT NULL,
  `quantity` int UNSIGNED NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura da tabela `appointment_payments`
--

CREATE TABLE `appointment_payments` (
  `id` bigint UNSIGNED NOT NULL,
  `appointment_id` bigint UNSIGNED NOT NULL,
  `method` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `base_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `fee_percent` decimal(8,2) NOT NULL DEFAULT '0.00',
  `fee_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `amount` decimal(10,2) NOT NULL,
  `card_brand` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `installments` smallint UNSIGNED DEFAULT NULL,
  `meta` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Extraindo dados da tabela `appointment_payments`
--

INSERT INTO `appointment_payments` (`id`, `appointment_id`, `method`, `base_amount`, `fee_percent`, `fee_amount`, `amount`, `card_brand`, `installments`, `meta`, `created_at`, `updated_at`) VALUES
(1, 1, 'pix', 80.00, 0.00, 0.00, 80.00, '', 1, '{\"legacy\": true, \"legacy_source\": \"appointments.payment_* columns\"}', '2025-11-26 13:22:26', '2025-12-03 10:27:11'),
(2, 3, 'pix', 35.00, 0.00, 0.00, 35.00, '', 1, '{\"legacy\": true, \"legacy_source\": \"appointments.payment_* columns\"}', '2025-11-26 13:28:52', '2025-12-03 10:26:55'),
(3, 4, 'pix', 80.00, 0.00, 0.00, 80.00, '', 1, '{\"legacy\": true, \"legacy_source\": \"appointments.payment_* columns\"}', '2025-11-26 13:30:06', '2025-12-03 10:26:58'),
(4, 5, 'pix', 350.00, 0.00, 0.00, 350.00, '', 1, '{\"legacy\": true, \"legacy_source\": \"appointments.payment_* columns\"}', '2025-11-26 13:37:10', '2025-12-03 10:27:07'),
(5, 6, 'pix', 100.00, 0.00, 0.00, 100.00, '', 1, '{\"legacy\": true, \"legacy_source\": \"appointments.payment_* columns\"}', '2025-11-26 13:41:13', '2025-12-03 10:27:00'),
(6, 8, 'pix', 100.00, 0.00, 0.00, 100.00, '', 1, '{\"legacy\": true, \"legacy_source\": \"appointments.payment_* columns\"}', '2025-11-26 13:57:22', '2025-12-03 10:27:03'),
(7, 36, 'pix', 70.00, 0.00, 0.00, 70.00, '', 1, '{\"legacy\": true, \"legacy_source\": \"appointments.payment_* columns\"}', '2026-01-19 14:58:19', '2026-01-19 16:22:31'),
(8, 37, 'pix', 115.00, 0.00, 0.00, 115.00, '', 1, '{\"legacy\": true, \"legacy_source\": \"appointments.payment_* columns\"}', '2026-01-19 15:01:29', '2026-01-19 16:23:16'),
(9, 38, 'credit', 75.00, 0.00, 0.00, 75.00, '', 1, '{\"legacy\": true, \"legacy_source\": \"appointments.payment_* columns\"}', '2026-01-19 15:21:42', '2026-01-19 16:23:53'),
(10, 39, 'pix', 337.50, 0.00, 0.00, 337.50, '', 1, '{\"legacy\": true, \"legacy_source\": \"appointments.payment_* columns\"}', '2026-01-19 15:23:47', '2026-01-19 16:24:58'),
(11, 42, 'credit', 170.00, 0.00, 0.00, 170.00, '', 1, '{\"legacy\": true, \"legacy_source\": \"appointments.payment_* columns\"}', '2026-01-19 15:47:49', '2026-01-19 16:25:19'),
(12, 43, 'cash', 50.00, 0.00, 0.00, 50.00, '', 1, '{\"legacy\": true, \"legacy_source\": \"appointments.payment_* columns\"}', '2026-01-19 15:48:48', '2026-01-20 08:25:21'),
(13, 50, 'pix', 80.00, 0.00, 0.00, 80.00, '', 1, '{\"legacy\": true, \"legacy_source\": \"appointments.payment_* columns\"}', '2026-01-19 16:32:44', '2026-01-21 15:17:32'),
(14, 51, 'credit', 50.00, 0.00, 0.00, 50.00, '', 1, '{\"legacy\": true, \"legacy_source\": \"appointments.payment_* columns\"}', '2026-01-19 16:33:27', '2026-01-21 15:17:59'),
(15, 63, 'pix', 0.00, 0.00, 0.00, 0.00, '', 1, '{\"legacy\": true, \"legacy_source\": \"appointments.payment_* columns\"}', '2026-01-21 15:49:13', '2026-01-21 15:50:11');

-- --------------------------------------------------------

--
-- Estrutura da tabela `appointment_service`
--

CREATE TABLE `appointment_service` (
  `id` bigint UNSIGNED NOT NULL,
  `appointment_id` bigint UNSIGNED NOT NULL,
  `service_id` bigint UNSIGNED NOT NULL,
  `professional_id` bigint UNSIGNED DEFAULT NULL,
  `service_price` decimal(12,2) NOT NULL,
  `commission_type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `commission_value` decimal(12,2) NOT NULL DEFAULT '0.00',
  `starts_at` datetime DEFAULT NULL,
  `ends_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Extraindo dados da tabela `appointment_service`
--

INSERT INTO `appointment_service` (`id`, `appointment_id`, `service_id`, `professional_id`, `service_price`, `commission_type`, `commission_value`, `starts_at`, `ends_at`, `created_at`, `updated_at`) VALUES
(52, 37, 69, 4, 80.00, 'percentage', 40.00, '2026-01-19 17:00:00', '2026-01-19 19:00:00', '2026-01-19 15:01:29', '2026-01-19 15:01:29'),
(53, 37, 78, 2, 50.00, 'percentage', 40.00, '2026-01-19 17:00:00', '2026-01-19 18:00:00', '2026-01-19 15:01:29', '2026-01-19 15:01:29'),
(56, 38, 85, 2, 80.00, 'percentage', 40.00, '2026-01-19 13:00:00', '2026-01-19 15:00:00', '2026-01-19 15:21:42', '2026-01-19 15:21:42'),
(62, 39, 45, 1, 400.00, 'percentage', 0.00, '2026-01-19 13:00:00', '2026-01-19 17:00:00', '2026-01-19 15:46:27', '2026-01-19 15:46:27'),
(63, 39, 132, 1, 275.00, 'percentage', 40.00, '2026-01-19 18:00:00', '2026-01-19 19:00:00', '2026-01-19 15:46:27', '2026-01-19 15:46:27'),
(64, 42, 31, 1, 180.00, 'percentage', 40.00, '2026-01-19 19:00:00', '2026-01-19 21:00:00', '2026-01-19 15:47:49', '2026-01-19 15:47:49'),
(65, 43, 1, 1, 50.00, 'percentage', 40.00, '2026-01-19 21:00:00', '2026-01-19 21:30:00', '2026-01-19 15:48:48', '2026-01-19 15:48:48'),
(66, 44, 69, 8, 80.00, 'percentage', 40.00, '2026-01-20 09:00:00', '2026-01-20 11:00:00', '2026-01-19 16:01:02', '2026-01-19 16:01:02'),
(67, 45, 69, 8, 80.00, 'percentage', 40.00, '2026-01-20 11:00:00', '2026-01-20 13:00:00', '2026-01-19 16:02:28', '2026-01-19 16:02:28'),
(74, 36, 69, 4, 80.00, 'percentage', 40.00, '2026-01-19 14:00:00', '2026-01-19 16:00:00', '2026-01-19 16:13:52', '2026-01-19 16:13:52'),
(75, 47, 78, 2, 50.00, 'percentage', 40.00, '2026-01-20 09:00:00', '2026-01-20 10:00:00', '2026-01-19 16:14:47', '2026-01-19 16:14:47'),
(76, 48, 69, 8, 80.00, 'percentage', 40.00, '2026-01-20 18:00:00', '2026-01-20 20:00:00', '2026-01-19 16:21:42', '2026-01-19 16:21:42'),
(79, 51, 69, 10, 80.00, 'percentage', 40.00, '2026-01-21 14:00:00', '2026-01-21 16:00:00', '2026-01-19 16:33:27', '2026-01-19 16:33:27'),
(82, 54, 95, 1, 55.00, 'percentage', 40.00, '2026-01-26 13:00:00', '2026-01-26 14:00:00', '2026-01-19 16:43:07', '2026-01-19 16:43:07'),
(83, 50, 69, 10, 80.00, 'percentage', 40.00, '2026-01-21 09:00:00', '2026-01-21 11:00:00', '2026-01-21 08:32:41', '2026-01-21 08:32:41'),
(84, 55, 100, 1, 60.00, 'percentage', 40.00, '2026-01-22 16:30:00', '2026-01-22 18:30:00', '2026-01-21 12:20:37', '2026-01-21 12:20:37'),
(85, 56, 133, 1, 300.00, 'percentage', 40.00, '2026-01-23 10:00:00', '2026-01-23 11:00:00', '2026-01-21 12:22:26', '2026-01-21 12:22:26'),
(86, 57, 69, 10, 80.00, 'percentage', 40.00, '2026-01-24 16:00:00', '2026-01-24 18:00:00', '2026-01-21 12:32:36', '2026-01-21 12:32:36'),
(87, 58, 90, 1, 50.00, 'percentage', 40.00, '2026-01-24 09:00:00', '2026-01-24 10:00:00', '2026-01-21 12:34:49', '2026-01-21 12:34:49'),
(88, 59, 100, 1, 60.00, 'percentage', 40.00, '2026-01-24 10:00:00', '2026-01-24 11:00:00', '2026-01-21 12:39:13', '2026-01-21 12:39:13'),
(89, 60, 90, 1, 50.00, 'percentage', 40.00, '2026-01-24 14:00:00', '2026-01-24 15:00:00', '2026-01-21 12:40:17', '2026-01-21 12:40:17'),
(90, 61, 3, 1, 170.00, 'percentage', 40.00, '2026-01-26 14:00:00', '2026-01-26 16:00:00', '2026-01-21 12:47:09', '2026-01-21 12:47:09'),
(92, 63, 95, 1, 55.00, 'percentage', 40.00, '2026-01-23 15:00:00', '2026-01-23 16:00:00', '2026-01-21 15:49:13', '2026-01-21 15:49:13'),
(95, 64, 69, 4, 80.00, 'percentage', 40.00, '2026-01-22 11:30:00', '2026-01-22 13:30:00', '2026-01-22 10:25:53', '2026-01-22 10:25:53');

-- --------------------------------------------------------

--
-- Estrutura da tabela `cache`
--

CREATE TABLE `cache` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura da tabela `cache_locks`
--

CREATE TABLE `cache_locks` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura da tabela `cashier_transactions`
--

CREATE TABLE `cashier_transactions` (
  `id` bigint UNSIGNED NOT NULL,
  `date` date NOT NULL,
  `type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `amount` decimal(12,2) NOT NULL,
  `payment_method` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference` varchar(160) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` bigint UNSIGNED DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura da tabela `commissions`
--

CREATE TABLE `commissions` (
  `id` bigint UNSIGNED NOT NULL,
  `professional_id` bigint UNSIGNED NOT NULL,
  `appointment_id` bigint UNSIGNED NOT NULL,
  `service_id` bigint UNSIGNED NOT NULL,
  `customer_id` bigint UNSIGNED NOT NULL,
  `date` date NOT NULL,
  `service_price` decimal(12,2) NOT NULL,
  `commission_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `commission_value` decimal(12,2) NOT NULL,
  `commission_amount` decimal(12,2) NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `payment_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Extraindo dados da tabela `commissions`
--

INSERT INTO `commissions` (`id`, `professional_id`, `appointment_id`, `service_id`, `customer_id`, `date`, `service_price`, `commission_type`, `commission_value`, `commission_amount`, `status`, `payment_date`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 3, 3, 62, 5, '2025-11-26', 35.00, 'percentage', 40.00, 14.00, 'pending', NULL, '2025-11-26 13:29:20', '2025-11-26 13:29:20', NULL),
(2, 10, 4, 69, 3, '2025-11-26', 80.00, 'percentage', 40.00, 32.00, 'pending', NULL, '2025-11-26 14:24:21', '2025-11-26 14:24:21', NULL),
(3, 3, 6, 87, 6, '2025-11-26', 100.00, 'percentage', 40.00, 40.00, 'pending', NULL, '2025-11-26 18:20:50', '2025-11-26 18:20:50', NULL),
(4, 2, 5, 3, 4, '2025-11-26', 170.00, 'percentage', 40.00, 68.00, 'pending', NULL, '2025-11-26 18:27:18', '2025-11-26 18:27:18', NULL),
(5, 10, 5, 69, 4, '2025-11-26', 80.00, 'percentage', 40.00, 32.00, 'pending', NULL, '2025-11-26 18:27:19', '2025-11-26 18:27:19', NULL),
(6, 2, 5, 78, 4, '2025-11-26', 50.00, 'percentage', 40.00, 20.00, 'pending', NULL, '2025-11-26 18:27:19', '2025-11-26 18:27:19', NULL),
(7, 8, 1, 69, 1, '2025-11-26', 80.00, 'percentage', 40.00, 32.00, 'pending', NULL, '2025-11-26 18:30:11', '2025-11-26 18:30:11', NULL),
(8, 8, 8, 69, 7, '2025-11-26', 80.00, 'percentage', 40.00, 32.00, 'pending', NULL, '2025-11-26 18:34:57', '2025-11-26 18:34:57', NULL),
(9, 4, 36, 69, 120, '2026-01-19', 80.00, 'percentage', 40.00, 32.00, 'pending', NULL, '2026-01-19 16:22:31', '2026-01-19 16:22:31', NULL),
(10, 4, 37, 69, 121, '2026-01-19', 80.00, 'percentage', 40.00, 32.00, 'pending', NULL, '2026-01-19 16:23:16', '2026-01-19 16:23:16', NULL),
(11, 2, 37, 78, 121, '2026-01-19', 50.00, 'percentage', 40.00, 20.00, 'pending', NULL, '2026-01-19 16:23:16', '2026-01-19 16:23:16', NULL),
(12, 2, 38, 85, 123, '2026-01-19', 80.00, 'percentage', 40.00, 32.00, 'pending', NULL, '2026-01-19 16:23:53', '2026-01-19 16:23:53', NULL),
(13, 1, 39, 45, 8, '2026-01-19', 400.00, 'percentage', 0.00, 0.00, 'pending', NULL, '2026-01-19 16:24:58', '2026-01-19 16:24:58', NULL),
(14, 1, 39, 132, 8, '2026-01-19', 275.00, 'percentage', 40.00, 110.00, 'pending', NULL, '2026-01-19 16:24:58', '2026-01-19 16:24:58', NULL),
(15, 1, 42, 31, 107, '2026-01-19', 180.00, 'percentage', 40.00, 72.00, 'pending', NULL, '2026-01-19 16:25:19', '2026-01-19 16:25:19', NULL),
(16, 1, 43, 1, 122, '2026-01-20', 50.00, 'percentage', 40.00, 20.00, 'pending', NULL, '2026-01-20 08:25:21', '2026-01-20 08:25:21', NULL),
(17, 10, 50, 69, 88, '2026-01-21', 80.00, 'percentage', 40.00, 32.00, 'pending', NULL, '2026-01-21 15:17:32', '2026-01-21 15:17:32', NULL),
(18, 10, 51, 69, 93, '2026-01-21', 80.00, 'percentage', 40.00, 32.00, 'pending', NULL, '2026-01-21 15:17:59', '2026-01-21 15:17:59', NULL),
(19, 1, 63, 95, 8, '2026-01-21', 55.00, 'percentage', 40.00, 22.00, 'pending', NULL, '2026-01-21 15:50:11', '2026-01-21 15:50:11', NULL);

-- --------------------------------------------------------

--
-- Estrutura da tabela `customers`
--

CREATE TABLE `customers` (
  `id` bigint UNSIGNED NOT NULL,
  `name` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cpf` varchar(14) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gender` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'not_informed',
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `email` varchar(160) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `alternate_phone` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `complement` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `neighborhood` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `zip_code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `birth_date` date DEFAULT NULL,
  `last_visit` timestamp NULL DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `contact_preferences` json DEFAULT NULL,
  `accepts_marketing` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Extraindo dados da tabela `customers`
--

INSERT INTO `customers` (`id`, `name`, `cpf`, `gender`, `active`, `email`, `phone`, `alternate_phone`, `address`, `number`, `complement`, `neighborhood`, `city`, `state`, `zip_code`, `birth_date`, `last_visit`, `notes`, `contact_preferences`, `accepts_marketing`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 'Thamires dona Iris', NULL, 'not_informed', 1, NULL, '81998251654', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'cliente de gel e cutilagem', '[\"email\", \"whatsapp\"]', 1, '2025-11-26 12:05:56', '2025-11-26 12:05:56', NULL),
(2, 'Mauricio', NULL, 'not_informed', 1, NULL, '81998231304', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'cliente de gel', '[\"email\", \"whatsapp\"]', 1, '2025-11-26 12:07:56', '2025-11-26 12:07:56', NULL),
(3, 'Paula 9', NULL, 'not_informed', 1, NULL, '81986962073', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'cliente de gel', '[\"whatsapp\"]', 1, '2025-11-26 12:08:58', '2025-11-26 12:09:49', NULL),
(4, 'Adrina 12', NULL, 'not_informed', 1, NULL, '81988714619', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'cliente de gel ( faz cutilagem com Maria)', '[\"whatsapp\"]', 1, '2025-11-26 12:13:55', '2025-11-26 12:13:55', NULL),
(5, 'Severina', NULL, 'not_informed', 1, NULL, '81998819118', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'cliente sobrancelha', '[\"whatsapp\"]', 1, '2025-11-26 12:15:17', '2025-11-26 12:15:17', NULL),
(6, 'Jessika Cliente', NULL, 'not_informed', 1, NULL, '8399641054', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'cliente Nova Cilios', '[\"whatsapp\"]', 1, '2025-11-26 12:17:33', '2025-11-26 12:17:33', NULL),
(7, 'Celia', NULL, 'not_informed', 1, NULL, '83988981884', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"whatsapp\"]', 1, '2025-11-26 13:56:26', '2025-11-26 13:56:26', NULL),
(8, 'Cassia', NULL, 'not_informed', 1, NULL, '81986372252', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'cliente de cabelo unhas e sobrancelha', '[\"whatsapp\"]', 1, '2025-11-26 14:30:39', '2025-11-26 14:30:39', NULL),
(9, 'Ilza', NULL, 'not_informed', 1, NULL, '81997112888', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Cliente de unhas em Gel só faz com michele', '[\"whatsapp\"]', 1, '2025-11-26 14:32:43', '2025-11-26 14:32:43', NULL),
(10, 'Thamires Dr Bety', NULL, 'not_informed', 1, NULL, '81992048310', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'cliente unhas e sobrancelha faz com Michele', '[\"email\", \"whatsapp\"]', 1, '2025-11-26 14:34:17', '2025-11-26 14:34:17', NULL),
(11, 'Meyriane', NULL, 'not_informed', 1, NULL, '81996758969', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'cliente de cabelo unhas e sobrancelha', '[\"whatsapp\"]', 1, '2025-11-26 14:35:20', '2025-11-26 14:35:20', NULL),
(12, 'Edilene', NULL, 'not_informed', 1, NULL, '81987217686', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'cliente de cabelo unhas e cabelo faz com Claudia', '[\"whatsapp\"]', 1, '2025-11-26 14:37:37', '2025-11-26 14:37:37', NULL),
(13, 'jane vó de Yasmin', NULL, 'not_informed', 1, NULL, '81996329971', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Vó de Yasmin', '[\"whatsapp\"]', 1, '2025-11-26 14:40:43', '2025-11-26 14:40:43', NULL),
(14, 'jane vó de Yasmin', NULL, 'not_informed', 1, NULL, '81996329971', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Vó de Yasmin', '[\"whatsapp\"]', 1, '2025-11-26 14:40:43', '2025-11-26 14:40:43', NULL),
(15, 'kaauane filha de luci', NULL, 'not_informed', 1, NULL, '81979102956', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'cliente de Trança unhas e sobrancelha faz com Thay', '[\"whatsapp\"]', 1, '2025-11-26 14:42:40', '2025-11-26 14:42:40', NULL),
(16, 'Rut', NULL, 'not_informed', 1, NULL, '81984666875', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'cliente de cabelo unhas e sobrancelha faz com Michele', '[\"whatsapp\"]', 1, '2025-11-26 14:43:51', '2025-11-26 14:43:51', NULL),
(17, 'Naly', NULL, 'not_informed', 1, NULL, '81983334313', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'cliente de cabelo unhas e sobrancelha faz com Maria', '[\"whatsapp\"]', 1, '2025-11-26 14:45:03', '2025-11-26 14:45:03', NULL),
(18, 'Mirela filha de Dija', NULL, 'not_informed', 1, NULL, '81987545623', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'filha de Dija', '[\"whatsapp\"]', 1, '2025-11-26 14:47:58', '2025-11-26 14:47:58', NULL),
(19, 'Karla morela 3', NULL, 'not_informed', 1, NULL, '81985542621', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'cliente de unhas', '[\"whatsapp\"]', 1, '2025-11-26 14:49:05', '2025-11-26 14:49:05', NULL),
(20, 'sandy', NULL, 'not_informed', 1, NULL, '81999333150', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'telefone da filha dela', '[\"whatsapp\"]', 1, '2025-12-02 16:05:59', '2025-12-02 16:05:59', NULL),
(21, 'Paula 6', NULL, 'not_informed', 1, NULL, '81984291591', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'mãe de Thays', '[\"whatsapp\"]', 1, '2025-12-02 16:12:42', '2025-12-02 16:12:42', NULL),
(22, 'vivian felix', NULL, 'not_informed', 1, NULL, '81995359291', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"whatsapp\"]', 1, '2025-12-02 16:13:55', '2025-12-02 16:13:55', NULL),
(23, 'karina 1', NULL, 'not_informed', 1, NULL, '81996352676', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"whatsapp\"]', 1, '2025-12-02 16:17:03', '2025-12-02 16:17:03', NULL),
(24, 'Adriana 9', NULL, 'not_informed', 1, NULL, '81983172846', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'cliente só faz com Maria', '[\"email\", \"whatsapp\"]', 1, '2025-12-02 16:19:04', '2025-12-02 16:19:04', NULL),
(25, 'Jane', NULL, 'not_informed', 1, NULL, '81986757756', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 16:22:22', '2025-12-02 16:22:22', NULL),
(26, 'Naiara', NULL, 'not_informed', 1, NULL, '81995214350', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 16:24:05', '2025-12-02 16:24:05', NULL),
(27, 'Nathaly', NULL, 'not_informed', 1, NULL, '81979151139', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 16:29:06', '2025-12-02 16:29:06', NULL),
(28, 'Mirela ( Dija)', NULL, 'not_informed', 1, NULL, '81987545623', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 16:31:08', '2025-12-02 16:33:38', NULL),
(29, 'Brenda', NULL, 'not_informed', 1, NULL, '8188118160', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 16:35:58', '2025-12-02 16:35:58', NULL),
(30, 'Natália simone', NULL, 'not_informed', 1, NULL, '81997972008', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 16:37:30', '2025-12-02 16:37:30', NULL),
(31, 'Nathacha (Nena)', NULL, 'not_informed', 1, NULL, '81993539989', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 16:38:30', '2025-12-02 16:38:30', NULL),
(32, 'Gleyce filha', NULL, 'not_informed', 1, NULL, '81998090246', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'kelly só faz Gel com Michele', '[\"email\", \"whatsapp\"]', 1, '2025-12-02 16:40:33', '2025-12-02 16:40:33', NULL),
(33, 'Virginia', NULL, 'not_informed', 1, NULL, '81973028538', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Mãe  de Ivanize', '[\"email\", \"whatsapp\"]', 1, '2025-12-02 16:41:52', '2025-12-02 16:41:52', NULL),
(34, 'Ivanize', NULL, 'not_informed', 1, NULL, '81984565864', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 16:43:06', '2025-12-02 16:43:06', NULL),
(35, 'Fabiana', NULL, 'not_informed', 1, NULL, '81985699473', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 16:44:29', '2025-12-02 16:44:29', NULL),
(36, 'Nelita mãe de Naiara', NULL, 'not_informed', 1, NULL, '81985033392', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'mãe de Naiara', '[\"email\", \"whatsapp\"]', 1, '2025-12-02 16:46:10', '2025-12-02 16:46:10', NULL),
(37, 'Sirleide', NULL, 'not_informed', 1, NULL, '81987590869', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 16:47:07', '2025-12-02 16:47:07', NULL),
(38, 'Fernanda', NULL, 'not_informed', 1, NULL, '81987767179', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 16:48:11', '2025-12-02 16:48:11', NULL),
(39, 'Eliana 1', NULL, 'not_informed', 1, NULL, '81985654307', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 16:49:23', '2025-12-02 16:49:23', NULL),
(40, 'Valeria', NULL, 'not_informed', 1, NULL, '81999875294', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 16:50:37', '2025-12-02 16:50:37', NULL),
(41, 'Janaina 2', NULL, 'not_informed', 1, NULL, '81999067943', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 16:52:50', '2025-12-02 16:52:50', NULL),
(42, 'Janaina 1', NULL, 'not_informed', 1, NULL, '81992647856', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 16:53:43', '2025-12-02 16:53:43', NULL),
(43, 'Wanessa 2', NULL, 'not_informed', 1, NULL, '81987946104', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 16:54:54', '2025-12-02 16:54:54', NULL),
(44, 'Claudia jau igreja', NULL, 'not_informed', 1, NULL, '81994894101', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 16:58:07', '2025-12-02 16:58:07', NULL),
(45, 'Sandra galega', NULL, 'not_informed', 1, NULL, '81987526699', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 16:59:48', '2025-12-02 16:59:48', NULL),
(46, 'Manu igreja 1', NULL, 'not_informed', 1, NULL, '81987920465', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 17:08:31', '2025-12-02 17:08:31', NULL),
(47, 'Estefane', NULL, 'not_informed', 1, NULL, '81999453049', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'cliente de sobrancelhas', '[\"email\", \"whatsapp\"]', 1, '2025-12-02 17:10:04', '2025-12-02 17:10:04', NULL),
(48, 'Vandira', NULL, 'not_informed', 1, NULL, '81997079419', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'só faz Gel com Michele', '[\"email\", \"whatsapp\"]', 1, '2025-12-02 17:12:28', '2025-12-02 17:12:28', NULL),
(49, 'Verônica', NULL, 'not_informed', 1, NULL, '81991454753', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 17:13:35', '2025-12-02 17:13:35', NULL),
(50, 'kita', NULL, 'not_informed', 1, NULL, '81998515108', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 17:15:11', '2025-12-02 17:15:11', NULL),
(51, 'Ângela (dina)', NULL, 'not_informed', 1, NULL, '81986921802', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 17:16:34', '2025-12-02 17:16:34', NULL),
(52, 'Valdete', NULL, 'not_informed', 1, NULL, '81984027672', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 17:17:13', '2025-12-02 17:17:13', NULL),
(53, 'Elizabet (amiga de Ane)', NULL, 'not_informed', 1, NULL, '81983068323', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Cliente complicada', '[\"email\"]', 1, '2025-12-02 17:18:29', '2025-12-02 17:18:29', NULL),
(54, 'Larissa', NULL, 'not_informed', 1, NULL, '81984473879', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 17:19:33', '2025-12-02 17:19:33', NULL),
(55, 'Eliane da igreja', NULL, 'not_informed', 1, NULL, '81985011471', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 17:20:39', '2025-12-02 17:20:39', NULL),
(56, 'Simone cliente nova', NULL, 'not_informed', 1, NULL, '81992428072', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 17:23:22', '2025-12-02 17:23:22', NULL),
(57, 'Simone gostosona', NULL, 'not_informed', 1, NULL, '81993356127', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 17:24:04', '2025-12-02 17:24:04', NULL),
(58, 'Simone morena', NULL, 'not_informed', 1, NULL, '81987975172', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 17:24:41', '2025-12-02 17:24:41', NULL),
(59, 'Camila (patora)', NULL, 'not_informed', 1, NULL, '81992322465', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 17:25:15', '2025-12-02 17:25:15', NULL),
(60, 'Diana (Dija)', NULL, 'not_informed', 1, NULL, '81986787542', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 17:27:22', '2025-12-02 17:27:22', NULL),
(61, 'Camila energia', NULL, 'not_informed', 1, NULL, '81988867618', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 17:28:27', '2025-12-02 17:28:27', NULL),
(62, 'Camila prima carla', NULL, 'not_informed', 1, NULL, '81983708502', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 17:29:25', '2025-12-02 17:29:25', NULL),
(63, 'Camila cliente nova', NULL, 'not_informed', 1, NULL, '81987553168', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 17:30:12', '2025-12-02 17:30:12', NULL),
(64, 'Camila de Cassia', NULL, 'not_informed', 1, NULL, '81984363649', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'complicada', '[\"email\", \"whatsapp\"]', 1, '2025-12-02 17:33:43', '2025-12-02 17:33:43', NULL),
(65, 'Carol maia', NULL, 'not_informed', 1, NULL, '81987356878', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 17:35:10', '2025-12-02 17:35:10', NULL),
(66, 'Ana Carla (amiga de camila)', NULL, 'not_informed', 1, NULL, '81999682770', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 17:38:36', '2025-12-02 17:38:36', NULL),
(67, 'Bianca galega', NULL, 'not_informed', 1, NULL, '81982207383', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 17:39:52', '2025-12-02 17:39:52', NULL),
(68, 'Yasmin', NULL, 'not_informed', 1, NULL, '81997934195', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 17:41:40', '2025-12-02 17:41:40', NULL),
(69, 'Mônica enfermeira', NULL, 'not_informed', 1, NULL, '81986948519', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 17:43:07', '2025-12-02 17:43:07', NULL),
(70, 'Mônica cabelereire', NULL, 'not_informed', 1, NULL, '81984491422', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 17:44:02', '2025-12-02 17:44:02', NULL),
(71, 'Jandira', NULL, 'not_informed', 1, NULL, '81988772387', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"sms\"]', 1, '2025-12-02 17:45:14', '2025-12-02 17:45:14', NULL),
(72, 'Bruna filha de Cibele', NULL, 'not_informed', 1, NULL, '81985065856', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 17:47:08', '2025-12-02 17:47:08', NULL),
(73, 'Paula 10', NULL, 'not_informed', 1, NULL, '81986121083', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\"]', 1, '2025-12-02 19:02:54', '2025-12-02 19:03:12', '2025-12-02 19:03:12'),
(74, 'Paula 10', NULL, 'not_informed', 1, NULL, '81986121083', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 19:02:54', '2025-12-02 19:03:25', NULL),
(75, 'Suzana', NULL, 'not_informed', 1, NULL, '81999399846', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 19:05:00', '2025-12-02 19:05:00', NULL),
(76, 'Cristiane', NULL, 'not_informed', 1, NULL, '81996703406', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 19:09:11', '2025-12-02 19:09:11', NULL),
(77, 'Bia amiga', NULL, 'not_informed', 1, NULL, '81991913843', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 19:10:11', '2025-12-02 19:10:11', NULL),
(78, 'Bia amiga 2', NULL, 'not_informed', 1, NULL, '81986650139', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 19:10:58', '2025-12-02 19:10:58', NULL),
(79, 'Dani IEMYS', NULL, 'not_informed', 1, NULL, '81986451556', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 19:13:24', '2025-12-02 19:13:24', NULL),
(80, 'Dani 1', NULL, 'not_informed', 1, NULL, '81987970060', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 19:14:44', '2025-12-02 19:14:44', NULL),
(81, 'Dani 2 Dona bety', NULL, 'not_informed', 1, NULL, '81987168489', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 19:15:49', '2025-12-02 19:15:49', NULL),
(82, 'Pastora noêmia', NULL, 'not_informed', 1, NULL, '81983003653', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 19:17:44', '2025-12-02 19:17:44', NULL),
(83, 'Ana Paula 5', NULL, 'not_informed', 1, NULL, '81988813967', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 19:32:56', '2025-12-02 19:32:56', NULL),
(84, 'Taciana', NULL, 'not_informed', 1, NULL, '81983613588', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 19:35:18', '2025-12-02 19:35:18', NULL),
(85, 'Andrea cliente 5', NULL, 'not_informed', 1, NULL, '81987654792', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 19:37:22', '2025-12-02 19:37:22', NULL),
(86, 'Priscila Verônica', NULL, 'not_informed', 1, NULL, '81998125676', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 19:39:05', '2025-12-02 19:39:05', NULL),
(87, 'Priscila dona Lurdinha', NULL, 'not_informed', 1, NULL, '81986702087', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 19:40:30', '2025-12-02 19:40:30', NULL),
(88, 'Luana', NULL, 'not_informed', 1, NULL, '81984094563', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 19:41:17', '2025-12-02 19:41:17', NULL),
(89, 'Pastora Ligia', NULL, 'not_informed', 1, NULL, '81997832090', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 19:43:02', '2025-12-02 19:43:02', NULL),
(90, 'Fernanda galega', NULL, 'not_informed', 1, NULL, '81994905356', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 19:43:49', '2025-12-02 19:43:49', NULL),
(91, 'Mariana São lorenço', NULL, 'not_informed', 1, NULL, '81998506082', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 19:45:03', '2025-12-02 19:45:03', NULL),
(92, 'Mary trancista', NULL, 'not_informed', 1, NULL, '81988406250', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 19:45:58', '2025-12-02 19:45:58', NULL),
(93, 'karla com k', NULL, 'not_informed', 1, NULL, '81987293249', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 19:47:05', '2025-12-02 19:47:05', NULL),
(94, 'Taisa', NULL, 'not_informed', 1, NULL, '81987551728', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 20:06:04', '2025-12-02 20:06:04', NULL),
(95, 'Adriana Maucio', NULL, 'not_informed', 1, NULL, '81998031284', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 20:09:35', '2025-12-02 20:09:35', NULL),
(96, 'Sandra cliente 5', NULL, 'not_informed', 1, NULL, '81987414043', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 20:12:34', '2025-12-02 20:12:34', NULL),
(97, 'Rebeka Edjane', NULL, 'not_informed', 1, NULL, '81996865976', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 20:13:36', '2025-12-02 20:13:36', NULL),
(98, 'Rebeka loja bia', NULL, 'not_informed', 1, NULL, '81998584232', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 20:14:44', '2025-12-02 20:14:44', NULL),
(99, 'Renata enfermeira', NULL, 'not_informed', 1, NULL, '81988898364', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\"]', 1, '2025-12-02 20:15:53', '2025-12-02 20:15:53', NULL),
(100, 'Renata de Edila', NULL, 'not_informed', 1, NULL, '81983181476', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 20:16:20', '2025-12-02 20:16:20', NULL),
(101, 'Renata galega', NULL, 'not_informed', 1, NULL, '81993889026', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 20:16:51', '2025-12-02 20:16:51', NULL),
(102, 'lany', NULL, 'not_informed', 1, NULL, '81998541267', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 20:17:56', '2025-12-02 20:17:56', NULL),
(103, 'laninha visinha', NULL, 'not_informed', 1, NULL, '81992241635', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 20:18:31', '2025-12-02 20:18:31', NULL),
(104, 'Emilly Bety', NULL, 'not_informed', 1, NULL, '81985810493', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 20:19:29', '2025-12-02 20:19:29', NULL),
(105, 'Emilly  de Aline', NULL, 'not_informed', 1, NULL, '81996963065', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 20:20:29', '2025-12-02 20:20:29', NULL),
(106, 'Mariela', NULL, 'not_informed', 1, NULL, '81986625773', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 20:21:38', '2025-12-02 20:21:38', NULL),
(107, 'Ane', NULL, 'not_informed', 1, NULL, '81997828840', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 20:22:28', '2025-12-02 20:22:28', NULL),
(108, 'Andresa 1', NULL, 'not_informed', 1, NULL, '81984590819', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 20:23:22', '2025-12-02 20:23:22', NULL),
(109, 'Nair', NULL, 'not_informed', 1, NULL, '81986755139', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 20:23:45', '2025-12-02 20:23:45', NULL),
(110, 'jussara', NULL, 'not_informed', 1, NULL, '81988621088', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 20:24:23', '2025-12-02 20:24:23', NULL),
(111, 'viviane cliente nova', NULL, 'not_informed', 1, NULL, '81997887686', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 20:25:11', '2025-12-02 20:25:11', NULL),
(112, 'vivian 2', NULL, 'not_informed', 1, NULL, '81987319465', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 20:26:28', '2025-12-02 20:26:28', NULL),
(113, 'luciana noronha', NULL, 'not_informed', 1, NULL, '81998764009', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-02 20:29:44', '2025-12-02 20:29:44', NULL),
(114, 'luciana  3', NULL, 'not_informed', 1, NULL, '81988091010', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\"]', 1, '2025-12-03 10:42:19', '2025-12-03 10:42:19', NULL),
(115, 'Kirley mãe de Dafne', NULL, 'not_informed', 1, NULL, '81987830417', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\"]', 1, '2025-12-03 12:24:01', '2025-12-03 12:24:01', NULL),
(116, 'Prazeres', NULL, 'not_informed', 1, NULL, '81987121091', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-03 12:59:58', '2025-12-03 12:59:58', NULL),
(117, 'Edjane', NULL, 'not_informed', 1, NULL, '81984676921', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-03 13:04:13', '2025-12-03 13:04:13', NULL),
(118, 'Melkia', NULL, 'not_informed', 1, NULL, '81999213214', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-03 13:09:50', '2025-12-03 13:09:50', NULL),
(119, 'Ana Carla (amiga de Maria)', NULL, 'not_informed', 1, NULL, '81999682770', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"email\", \"whatsapp\"]', 1, '2025-12-03 13:43:56', '2025-12-03 13:43:56', NULL),
(120, 'cristiane cardoso', NULL, 'not_informed', 1, NULL, '81984426052', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'cliente de Gel', '[\"whatsapp\"]', 1, '2026-01-19 08:58:42', '2026-01-19 08:58:42', NULL),
(121, 'Iris thamires', NULL, 'not_informed', 1, NULL, '81985860627', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"whatsapp\"]', 1, '2026-01-19 14:56:53', '2026-01-19 14:56:53', NULL),
(122, 'allany', NULL, 'not_informed', 1, NULL, '81973140493', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"whatsapp\"]', 1, '2026-01-19 15:09:17', '2026-01-19 15:09:17', NULL),
(123, 'rosania', NULL, 'not_informed', 1, NULL, '81998960272', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"whatsapp\"]', 1, '2026-01-19 15:11:56', '2026-01-19 15:11:56', NULL),
(124, 'Maria mayque', NULL, 'not_informed', 1, NULL, '83987321980', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"whatsapp\"]', 1, '2026-01-19 15:14:26', '2026-01-19 15:14:26', NULL),
(125, 'luci', NULL, 'not_informed', 1, NULL, '81984342985', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"whatsapp\"]', 1, '2026-01-19 16:18:37', '2026-01-19 16:18:37', NULL),
(126, 'Betania', NULL, 'not_informed', 1, NULL, '81997121956', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"whatsapp\"]', 1, '2026-01-19 16:34:21', '2026-01-19 16:34:21', NULL),
(127, 'Ana paula 9', NULL, 'not_informed', 1, NULL, '81986962073', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"whatsapp\"]', 1, '2026-01-19 16:37:39', '2026-01-19 16:37:39', NULL),
(128, 'Ana celia', NULL, 'not_informed', 1, NULL, '81996364797', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"whatsapp\"]', 1, '2026-01-21 12:19:32', '2026-01-21 12:19:32', NULL),
(129, 'PATY', NULL, 'not_informed', 1, NULL, '81999739426', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"whatsapp\"]', 1, '2026-01-21 12:37:18', '2026-01-21 12:37:18', NULL),
(130, 'ERIKA DIRA', NULL, 'not_informed', 1, NULL, '81991180860', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"whatsapp\"]', 1, '2026-01-21 12:38:16', '2026-01-21 12:38:16', NULL),
(131, 'BIA JOHNNY', NULL, 'not_informed', 1, NULL, '81986816246', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[\"whatsapp\"]', 1, '2026-01-21 12:44:43', '2026-01-21 12:44:43', NULL);

-- --------------------------------------------------------

--
-- Estrutura da tabela `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint UNSIGNED NOT NULL,
  `uuid` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura da tabela `items`
--

CREATE TABLE `items` (
  `id` bigint UNSIGNED NOT NULL,
  `name` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `price` decimal(12,2) NOT NULL,
  `cost` decimal(12,2) DEFAULT NULL,
  `stock` int UNSIGNED NOT NULL DEFAULT '0',
  `min_stock` int UNSIGNED NOT NULL DEFAULT '0',
  `category` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `supplier_id` bigint UNSIGNED DEFAULT NULL,
  `barcode` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `commission_type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `commission_value` decimal(12,2) NOT NULL DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Extraindo dados da tabela `items`
--

INSERT INTO `items` (`id`, `name`, `description`, `price`, `cost`, `stock`, `min_stock`, `category`, `supplier_id`, `barcode`, `commission_type`, `commission_value`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 'kit tratamento', 'Shampoo, condicionador, mascara de tratamento', 70.00, 35.00, 5, 10, 'Cabelo', NULL, NULL, 'percentage', 0.00, '2025-11-25 18:23:18', '2025-11-25 18:23:18', NULL),
(2, 'kit cronograma', 'Shampoo, condicionador, hidratação, reconstrução, nutrição', 100.00, 45.00, 1, 10, 'Cabelo', NULL, NULL, 'percentage', 0.00, '2025-11-25 18:26:40', '2025-11-25 18:26:40', NULL),
(3, 'Sabonete intimo', 'Sabonete diversos', 10.00, 4.00, 8, 10, 'Cuidados Íntimos', NULL, NULL, 'percentage', 0.00, '2025-11-25 18:32:55', '2025-11-25 18:32:55', NULL),
(4, 'Café simples', 'Cortesia', 0.00, 3.00, 0, 0, 'Cortesia', NULL, NULL, 'percentage', 0.00, '2025-11-25 18:34:09', '2025-11-25 18:34:51', NULL),
(5, 'Capuccino', 'Cortesia', 0.00, 5.00, 0, 0, 'Cortesia', NULL, NULL, 'percentage', 0.00, '2025-11-25 18:35:51', '2025-11-25 18:35:51', NULL),
(6, 'Soda italiana', 'cortesia', 0.00, 7.00, 0, 0, 'Cortesia', NULL, NULL, 'percentage', 0.00, '2025-11-25 18:36:45', '2025-11-25 18:36:45', NULL);

-- --------------------------------------------------------

--
-- Estrutura da tabela `item_prices`
--

CREATE TABLE `item_prices` (
  `id` bigint UNSIGNED NOT NULL,
  `item_id` bigint UNSIGNED NOT NULL,
  `price` decimal(12,2) NOT NULL,
  `cost` decimal(12,2) DEFAULT NULL,
  `margin` decimal(5,2) DEFAULT NULL,
  `effective_date` date DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura da tabela `item_price_histories`
--

CREATE TABLE `item_price_histories` (
  `id` bigint UNSIGNED NOT NULL,
  `item_id` bigint UNSIGNED NOT NULL,
  `old_price` decimal(12,2) DEFAULT NULL,
  `new_price` decimal(12,2) NOT NULL,
  `change_date` timestamp NOT NULL,
  `changed_by` bigint UNSIGNED DEFAULT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura da tabela `jobs`
--

CREATE TABLE `jobs` (
  `id` bigint UNSIGNED NOT NULL,
  `queue` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempts` tinyint UNSIGNED NOT NULL,
  `reserved_at` int UNSIGNED DEFAULT NULL,
  `available_at` int UNSIGNED NOT NULL,
  `created_at` int UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura da tabela `job_batches`
--

CREATE TABLE `job_batches` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_jobs` int NOT NULL,
  `pending_jobs` int NOT NULL,
  `failed_jobs` int NOT NULL,
  `failed_job_ids` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` mediumtext COLLATE utf8mb4_unicode_ci,
  `cancelled_at` int DEFAULT NULL,
  `created_at` int NOT NULL,
  `finished_at` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura da tabela `migrations`
--

CREATE TABLE `migrations` (
  `id` int UNSIGNED NOT NULL,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Extraindo dados da tabela `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '2025_09_19_130725_create_roles_table', 1),
(2, '2025_09_19_130726_create_screens_table', 1),
(3, '2025_09_19_130727_create_actions_table', 1),
(4, '2025_09_19_130728_create_permissons_table', 1),
(5, '2025_09_19_130729_create_users_table', 1),
(6, '2025_09_19_130730_create_role_user_table', 1),
(7, '2025_09_19_130731_create_cache_table', 1),
(8, '2025_09_19_130732_create_jobs_table', 1),
(9, '2025_09_19_161438_create_personal_access_tokens_table', 1),
(10, '2025_09_19_170000_create_services_table', 1),
(11, '2025_09_19_170100_create_professionals_table', 1),
(12, '2025_09_19_170200_create_customers_table', 1),
(13, '2025_09_19_170200_create_states_table', 1),
(14, '2025_09_19_170300_create_suppliers_table', 1),
(15, '2025_09_19_170400_create_items_table', 1),
(16, '2025_09_19_170500_create_promotions_table', 1),
(17, '2025_09_19_170600_create_appointments_table', 1),
(18, '2025_09_19_170700_create_appointment_service_table', 1),
(19, '2025_09_19_170705_create_appointment_item_table', 1),
(20, '2025_09_19_170800_create_commissions_table', 1),
(21, '2025_09_19_170900_create_accounts_payable_table', 1),
(22, '2025_09_19_171000_create_cashier_transactions_table', 1),
(23, '2025_09_19_171100_create_item_prices_table', 1),
(24, '2025_09_19_171200_create_item_price_histories_table', 1),
(25, '2025_09_19_171300_create_promotion_service_table', 1),
(26, '2025_09_19_171400_create_promotion_item_table', 1),
(27, '2025_11_26_172000_add_recurrence_columns_to_promotions_table', 2),
(28, '2025_11_26_172500_alter_appointments_add_discount_type', 2),
(29, '2025_11_27_112300_add_cpf_to_suppliers_table', 3),
(30, '2025_11_27_213000_create_professional_open_windows', 3),
(31, '2025_11_27_213500_add_time_columns_to_appointment_service_table', 3),
(32, '2025_12_03_124000_alter_appointment_service_unique_key', 4),
(33, '2025_12_04_102000_alter_appointments_add_payment_status', 5),
(34, '2026_01_21_144900_create_appointment_payments_table', 6),
(35, '2026_01_21_163000_drop_legacy_payment_columns_from_appointments_table', 7);

-- --------------------------------------------------------

--
-- Estrutura da tabela `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura da tabela `permissions`
--

CREATE TABLE `permissions` (
  `id` bigint UNSIGNED NOT NULL,
  `role_id` bigint UNSIGNED NOT NULL,
  `screen_id` bigint UNSIGNED NOT NULL,
  `action_id` bigint UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Extraindo dados da tabela `permissions`
--

INSERT INTO `permissions` (`id`, `role_id`, `screen_id`, `action_id`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 2, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(2, 1, 2, 2, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(3, 1, 2, 1, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(4, 1, 2, 3, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(5, 1, 2, 4, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(6, 1, 3, 2, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(7, 1, 3, 1, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(8, 1, 3, 3, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(9, 1, 3, 4, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(10, 1, 4, 2, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(11, 1, 4, 1, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(12, 1, 4, 3, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(13, 1, 4, 4, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(14, 1, 5, 2, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(15, 1, 5, 1, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(16, 1, 5, 3, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(17, 1, 5, 4, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(18, 1, 6, 2, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(19, 1, 6, 1, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(20, 1, 6, 3, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(21, 1, 6, 4, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(22, 1, 7, 2, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(23, 1, 7, 1, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(24, 1, 7, 3, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(25, 1, 7, 4, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(26, 1, 8, 2, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(27, 1, 8, 1, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(28, 1, 8, 3, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(29, 1, 8, 4, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(30, 1, 9, 2, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(31, 1, 9, 1, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(32, 1, 9, 3, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(33, 1, 9, 4, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(34, 1, 10, 2, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(35, 1, 10, 1, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(36, 1, 10, 3, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(37, 1, 10, 4, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(38, 1, 11, 2, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(39, 1, 11, 1, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(40, 1, 11, 3, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(41, 1, 11, 4, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(42, 1, 12, 2, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(43, 1, 12, 1, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(44, 1, 12, 3, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(45, 1, 12, 4, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(46, 1, 13, 2, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(47, 1, 13, 1, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(48, 1, 13, 3, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(49, 1, 13, 4, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(50, 1, 14, 2, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(51, 1, 14, 1, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(52, 1, 14, 3, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(53, 1, 14, 4, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(54, 1, 15, 2, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(55, 1, 15, 1, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(56, 1, 15, 3, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(57, 1, 15, 4, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(58, 1, 16, 2, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(59, 1, 16, 1, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(60, 1, 16, 3, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(61, 1, 16, 4, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(62, 1, 17, 2, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(63, 1, 17, 1, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(64, 1, 17, 3, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(65, 1, 17, 4, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(66, 1, 18, 2, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(67, 2, 1, 2, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(68, 2, 7, 2, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(69, 2, 7, 1, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(70, 2, 7, 3, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(71, 2, 7, 4, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(72, 2, 8, 2, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(73, 2, 8, 1, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(74, 2, 8, 3, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(75, 2, 8, 4, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(76, 2, 9, 2, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(77, 2, 9, 1, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(78, 2, 9, 3, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(79, 2, 10, 2, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(80, 2, 10, 1, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(81, 2, 10, 3, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(82, 2, 10, 4, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(83, 2, 11, 2, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(84, 2, 11, 1, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(85, 2, 11, 3, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(86, 2, 11, 4, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(87, 2, 12, 2, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(88, 2, 12, 1, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(89, 2, 12, 3, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(90, 2, 12, 4, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(91, 2, 13, 2, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(92, 2, 13, 1, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(93, 2, 13, 3, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(94, 2, 13, 4, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(95, 2, 14, 2, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(96, 2, 14, 3, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(97, 2, 15, 2, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(98, 2, 15, 1, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(99, 2, 15, 3, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(100, 2, 16, 2, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(101, 2, 16, 1, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(102, 2, 16, 3, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(103, 2, 16, 4, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(104, 2, 17, 2, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(105, 2, 17, 1, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(106, 2, 17, 3, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(107, 2, 17, 4, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(108, 2, 18, 2, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(109, 3, 13, 2, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(110, 3, 14, 2, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(111, 4, 13, 2, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(112, 4, 13, 1, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(113, 4, 13, 3, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(114, 4, 9, 2, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(115, 4, 9, 1, '2025-11-23 02:18:55', '2025-11-23 02:18:55'),
(116, 4, 9, 3, '2025-11-23 02:18:55', '2025-11-23 02:18:55');

-- --------------------------------------------------------

--
-- Estrutura da tabela `personal_access_tokens`
--

CREATE TABLE `personal_access_tokens` (
  `id` bigint UNSIGNED NOT NULL,
  `tokenable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenable_id` bigint UNSIGNED NOT NULL,
  `name` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `abilities` text COLLATE utf8mb4_unicode_ci,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Extraindo dados da tabela `personal_access_tokens`
--

INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES
(11, 'App\\Models\\User', 2, 'auth_token', '431b428acee6ed7a3576365c3ec2d8483e7a5e6cfb78b86a6bc70aa703534021', '[\"*\"]', '2025-11-26 00:18:17', NULL, '2025-11-25 19:04:15', '2025-11-26 00:18:17'),
(50, 'App\\Models\\User', 1, 'auth_token', '072e60c273d0d98108a446b70e479639e97cd83f414282c7e849a04e54228e02', '[\"*\"]', '2026-01-22 11:51:18', NULL, '2026-01-21 08:31:00', '2026-01-22 11:51:18'),
(51, 'App\\Models\\User', 11, 'auth_token', '4a49563c142390b3f53b77851814f824d550f1481b47465357ea8aba85e7ec77', '[\"*\"]', '2026-01-23 03:35:58', NULL, '2026-01-22 08:41:17', '2026-01-23 03:35:58');

-- --------------------------------------------------------

--
-- Estrutura da tabela `professionals`
--

CREATE TABLE `professionals` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `phone` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `specialties` json DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `work_schedule` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Extraindo dados da tabela `professionals`
--

INSERT INTO `professionals` (`id`, `user_id`, `phone`, `specialties`, `active`, `work_schedule`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 5, '81983210571', '[\"Cabelereira\"]', 1, '[{\"day\": \"Segunda-feira\", \"endTime\": \"22:30\", \"isDayOff\": false, \"lunchEnd\": \"18:00\", \"startTime\": \"13:00\", \"lunchStart\": \"17:00\", \"isWorkingDay\": true}, {\"day\": \"Terça-feira\", \"endTime\": \"22:30\", \"isDayOff\": false, \"lunchEnd\": \"18:00\", \"startTime\": \"13:00\", \"lunchStart\": \"17:00\", \"isWorkingDay\": true}, {\"day\": \"Quarta-feira\", \"endTime\": \"18:00\", \"isDayOff\": true, \"lunchEnd\": \"13:00\", \"startTime\": \"09:00\", \"lunchStart\": \"12:00\", \"isWorkingDay\": false}, {\"day\": \"Quinta-feira\", \"endTime\": \"22:30\", \"isDayOff\": false, \"lunchEnd\": \"18:00\", \"startTime\": \"13:00\", \"lunchStart\": \"17:00\", \"isWorkingDay\": true}, {\"day\": \"Sexta-feira\", \"endTime\": \"22:30\", \"isDayOff\": false, \"lunchEnd\": \"13:00\", \"startTime\": \"09:00\", \"lunchStart\": \"12:00\", \"isWorkingDay\": true}, {\"day\": \"Sábado\", \"endTime\": \"20:30\", \"isDayOff\": false, \"lunchEnd\": \"13:00\", \"startTime\": \"09:00\", \"lunchStart\": \"12:00\", \"isWorkingDay\": true}, {\"day\": \"Domingo\", \"endTime\": \"18:00\", \"isDayOff\": true, \"lunchEnd\": \"13:00\", \"startTime\": \"09:00\", \"lunchStart\": \"12:00\", \"isWorkingDay\": false}]', '2025-11-24 16:50:25', '2025-12-03 12:59:12', NULL),
(2, 6, '81998727460', '[\"Manicure\", \"Cabelereira\"]', 1, '[{\"day\": \"Segunda-feira\", \"endTime\": \"19:30\", \"isDayOff\": false, \"lunchEnd\": \"16:00\", \"startTime\": \"12:00\", \"lunchStart\": \"15:00\", \"isWorkingDay\": true}, {\"day\": \"Terça-feira\", \"endTime\": \"18:00\", \"isDayOff\": false, \"lunchEnd\": \"13:00\", \"startTime\": \"09:00\", \"lunchStart\": \"12:00\", \"isWorkingDay\": true}, {\"day\": \"Quarta-feira\", \"endTime\": \"19:30\", \"isDayOff\": true, \"lunchEnd\": \"16:00\", \"startTime\": \"12:00\", \"lunchStart\": \"15:00\", \"isWorkingDay\": true}, {\"day\": \"Quinta-feira\", \"endTime\": \"19:30\", \"isDayOff\": false, \"lunchEnd\": \"16:00\", \"startTime\": \"12:00\", \"lunchStart\": \"15:00\", \"isWorkingDay\": true}, {\"day\": \"Sexta-feira\", \"endTime\": \"18:30\", \"isDayOff\": false, \"lunchEnd\": \"13:00\", \"startTime\": \"09:00\", \"lunchStart\": \"12:00\", \"isWorkingDay\": true}, {\"day\": \"Sábado\", \"endTime\": \"18:30\", \"isDayOff\": false, \"lunchEnd\": \"13:00\", \"startTime\": \"09:00\", \"lunchStart\": \"12:00\", \"isWorkingDay\": true}, {\"day\": \"Domingo\", \"endTime\": \"18:00\", \"isDayOff\": true, \"lunchEnd\": \"13:00\", \"startTime\": \"09:00\", \"lunchStart\": \"12:00\", \"isWorkingDay\": false}]', '2025-11-24 16:53:53', '2026-01-19 16:14:28', NULL),
(3, 7, '81986905456', '[\"Design de sobrancelha\", \"Lash design\"]', 1, '[{\"day\": \"Segunda-feira\", \"endTime\": \"18:30\", \"isDayOff\": false, \"lunchEnd\": \"13:00\", \"startTime\": \"10:30\", \"lunchStart\": \"12:00\", \"isWorkingDay\": true}, {\"day\": \"Terça-feira\", \"endTime\": \"18:30\", \"isDayOff\": true, \"lunchEnd\": \"13:00\", \"startTime\": \"19:30\", \"lunchStart\": \"12:00\", \"isWorkingDay\": true}, {\"day\": \"Quarta-feira\", \"endTime\": \"18:30\", \"isDayOff\": false, \"lunchEnd\": \"13:00\", \"startTime\": \"10:30\", \"lunchStart\": \"12:00\", \"isWorkingDay\": true}, {\"day\": \"Quinta-feira\", \"endTime\": \"18:30\", \"isDayOff\": false, \"lunchEnd\": \"13:00\", \"startTime\": \"10:30\", \"lunchStart\": \"12:00\", \"isWorkingDay\": true}, {\"day\": \"Sexta-feira\", \"endTime\": \"18:30\", \"isDayOff\": false, \"lunchEnd\": \"13:00\", \"startTime\": \"09:00\", \"lunchStart\": \"12:00\", \"isWorkingDay\": true}, {\"day\": \"Sábado\", \"endTime\": \"18:30\", \"isDayOff\": false, \"lunchEnd\": \"13:00\", \"startTime\": \"09:00\", \"lunchStart\": \"12:00\", \"isWorkingDay\": true}, {\"day\": \"Domingo\", \"endTime\": \"18:00\", \"isDayOff\": true, \"lunchEnd\": \"13:00\", \"startTime\": \"09:00\", \"lunchStart\": \"12:00\", \"isWorkingDay\": false}]', '2025-11-24 17:06:36', '2025-11-24 17:06:36', NULL),
(4, 9, '81997685776', '[\"Nail design\"]', 1, '[{\"day\": \"Segunda-feira\", \"endTime\": \"19:30\", \"isDayOff\": false, \"lunchEnd\": \"17:00\", \"startTime\": \"11:30\", \"lunchStart\": \"16:00\", \"isWorkingDay\": true}, {\"day\": \"Terça-feira\", \"endTime\": \"19:30\", \"isDayOff\": false, \"lunchEnd\": \"17:00\", \"startTime\": \"11:30\", \"lunchStart\": \"16:00\", \"isWorkingDay\": true}, {\"day\": \"Quarta-feira\", \"endTime\": \"18:00\", \"isDayOff\": true, \"lunchEnd\": \"13:00\", \"startTime\": \"09:00\", \"lunchStart\": \"12:00\", \"isWorkingDay\": true}, {\"day\": \"Quinta-feira\", \"endTime\": \"19:30\", \"isDayOff\": false, \"lunchEnd\": \"17:00\", \"startTime\": \"11:30\", \"lunchStart\": \"16:00\", \"isWorkingDay\": true}, {\"day\": \"Sexta-feira\", \"endTime\": \"18:30\", \"isDayOff\": false, \"lunchEnd\": \"13:00\", \"startTime\": \"09:00\", \"lunchStart\": \"12:00\", \"isWorkingDay\": true}, {\"day\": \"Sábado\", \"endTime\": \"18:30\", \"isDayOff\": false, \"lunchEnd\": \"13:00\", \"startTime\": \"09:00\", \"lunchStart\": \"12:00\", \"isWorkingDay\": true}, {\"day\": \"Domingo\", \"endTime\": \"18:00\", \"isDayOff\": true, \"lunchEnd\": \"13:00\", \"startTime\": \"09:00\", \"lunchStart\": \"12:00\", \"isWorkingDay\": false}]', '2025-11-24 17:09:34', '2025-11-24 17:09:34', NULL),
(5, 10, NULL, '[\"Manicure\"]', 1, '[{\"day\": \"Segunda-feira\", \"endTime\": \"17:30\", \"isDayOff\": false, \"lunchEnd\": \"13:00\", \"startTime\": \"09:30\", \"lunchStart\": \"12:00\", \"isWorkingDay\": true}, {\"day\": \"Terça-feira\", \"endTime\": \"17:30\", \"isDayOff\": false, \"lunchEnd\": \"13:00\", \"startTime\": \"09:30\", \"lunchStart\": \"12:00\", \"isWorkingDay\": true}, {\"day\": \"Quarta-feira\", \"endTime\": \"18:00\", \"isDayOff\": true, \"lunchEnd\": \"13:00\", \"startTime\": \"09:00\", \"lunchStart\": \"12:00\", \"isWorkingDay\": true}, {\"day\": \"Quinta-feira\", \"endTime\": \"17:30\", \"isDayOff\": false, \"lunchEnd\": \"13:00\", \"startTime\": \"09:30\", \"lunchStart\": \"12:00\", \"isWorkingDay\": true}, {\"day\": \"Sexta-feira\", \"endTime\": \"18:30\", \"isDayOff\": false, \"lunchEnd\": \"13:00\", \"startTime\": \"09:00\", \"lunchStart\": \"12:00\", \"isWorkingDay\": true}, {\"day\": \"Sábado\", \"endTime\": \"18:30\", \"isDayOff\": false, \"lunchEnd\": \"13:00\", \"startTime\": \"09:00\", \"lunchStart\": \"12:00\", \"isWorkingDay\": true}, {\"day\": \"Domingo\", \"endTime\": \"18:00\", \"isDayOff\": true, \"lunchEnd\": \"13:00\", \"startTime\": \"09:00\", \"lunchStart\": \"12:00\", \"isWorkingDay\": false}]', '2025-11-24 17:11:59', '2026-01-19 08:54:36', '2026-01-19 08:54:36'),
(6, 3, '81984530812', '[\"ADM\"]', 1, '[{\"day\": \"Segunda-feira\", \"endTime\": \"19:30\", \"isDayOff\": false, \"lunchEnd\": \"13:00\", \"startTime\": \"11:30\", \"lunchStart\": \"12:00\", \"isWorkingDay\": true}, {\"day\": \"Terça-feira\", \"endTime\": \"19:30\", \"isDayOff\": false, \"lunchEnd\": \"13:00\", \"startTime\": \"11:30\", \"lunchStart\": \"12:00\", \"isWorkingDay\": true}, {\"day\": \"Quarta-feira\", \"endTime\": \"18:00\", \"isDayOff\": true, \"lunchEnd\": \"13:00\", \"startTime\": \"09:00\", \"lunchStart\": \"12:00\", \"isWorkingDay\": true}, {\"day\": \"Quinta-feira\", \"endTime\": \"19:30\", \"isDayOff\": false, \"lunchEnd\": \"13:00\", \"startTime\": \"11:30\", \"lunchStart\": \"12:00\", \"isWorkingDay\": true}, {\"day\": \"Sexta-feira\", \"endTime\": \"18:30\", \"isDayOff\": false, \"lunchEnd\": \"13:00\", \"startTime\": \"09:00\", \"lunchStart\": \"12:00\", \"isWorkingDay\": true}, {\"day\": \"Sábado\", \"endTime\": \"18:30\", \"isDayOff\": false, \"lunchEnd\": \"13:00\", \"startTime\": \"09:00\", \"lunchStart\": \"12:00\", \"isWorkingDay\": true}, {\"day\": \"Domingo\", \"endTime\": \"18:00\", \"isDayOff\": true, \"lunchEnd\": \"13:00\", \"startTime\": \"09:00\", \"lunchStart\": \"12:00\", \"isWorkingDay\": false}]', '2025-11-24 17:16:03', '2025-11-24 17:30:11', NULL),
(7, 4, '81979083615', '[\"ADM\"]', 1, '[{\"day\": \"Segunda-feira\", \"endTime\": \"21:00\", \"isDayOff\": false, \"lunchEnd\": \"18:00\", \"startTime\": \"14:00\", \"lunchStart\": \"17:00\", \"isWorkingDay\": true}, {\"day\": \"Terça-feira\", \"endTime\": \"21:00\", \"isDayOff\": false, \"lunchEnd\": \"18:00\", \"startTime\": \"14:00\", \"lunchStart\": \"17:00\", \"isWorkingDay\": true}, {\"day\": \"Quarta-feira\", \"endTime\": \"21:00\", \"isDayOff\": false, \"lunchEnd\": \"18:00\", \"startTime\": \"14:00\", \"lunchStart\": \"17:00\", \"isWorkingDay\": true}, {\"day\": \"Quinta-feira\", \"endTime\": \"18:00\", \"isDayOff\": true, \"lunchEnd\": \"13:00\", \"startTime\": \"09:00\", \"lunchStart\": \"12:00\", \"isWorkingDay\": true}, {\"day\": \"Sexta-feira\", \"endTime\": \"18:30\", \"isDayOff\": false, \"lunchEnd\": \"13:00\", \"startTime\": \"09:00\", \"lunchStart\": \"12:00\", \"isWorkingDay\": true}, {\"day\": \"Sábado\", \"endTime\": \"18:30\", \"isDayOff\": false, \"lunchEnd\": \"13:00\", \"startTime\": \"09:00\", \"lunchStart\": \"12:00\", \"isWorkingDay\": true}, {\"day\": \"Domingo\", \"endTime\": \"18:00\", \"isDayOff\": true, \"lunchEnd\": \"13:00\", \"startTime\": \"09:00\", \"lunchStart\": \"12:00\", \"isWorkingDay\": false}]', '2025-11-24 17:19:05', '2025-11-24 17:29:36', NULL),
(8, 1, '81987449994', '[\"CEO\", \"Nail design\"]', 1, '[{\"day\": \"Segunda-feira\", \"endTime\": \"18:30\", \"isDayOff\": true, \"lunchEnd\": \"14:00\", \"startTime\": \"09:00\", \"lunchStart\": \"13:00\", \"isWorkingDay\": true}, {\"day\": \"Terça-feira\", \"endTime\": \"22:30\", \"isDayOff\": false, \"lunchEnd\": \"14:00\", \"startTime\": \"09:00\", \"lunchStart\": \"13:00\", \"isWorkingDay\": true}, {\"day\": \"Quarta-feira\", \"endTime\": \"22:30\", \"isDayOff\": false, \"lunchEnd\": \"14:00\", \"startTime\": \"09:00\", \"lunchStart\": \"13:00\", \"isWorkingDay\": true}, {\"day\": \"Quinta-feira\", \"endTime\": \"22:30\", \"isDayOff\": false, \"lunchEnd\": \"14:00\", \"startTime\": \"09:00\", \"lunchStart\": \"13:00\", \"isWorkingDay\": true}, {\"day\": \"Sexta-feira\", \"endTime\": \"22:00\", \"isDayOff\": false, \"lunchEnd\": \"13:00\", \"startTime\": \"09:00\", \"lunchStart\": \"12:00\", \"isWorkingDay\": true}, {\"day\": \"Sábado\", \"endTime\": \"22:00\", \"isDayOff\": false, \"lunchEnd\": \"13:00\", \"startTime\": \"09:00\", \"lunchStart\": \"12:00\", \"isWorkingDay\": true}, {\"day\": \"Domingo\", \"endTime\": \"18:00\", \"isDayOff\": true, \"lunchEnd\": \"13:00\", \"startTime\": \"09:00\", \"lunchStart\": \"12:00\", \"isWorkingDay\": false}]', '2025-11-24 17:23:18', '2025-12-03 12:20:14', NULL),
(9, 2, '81986627093', '[\"ADM\"]', 1, '[{\"day\": \"Segunda-feira\", \"endTime\": \"16:30\", \"isDayOff\": false, \"lunchEnd\": \"13:00\", \"startTime\": \"09:00\", \"lunchStart\": \"12:00\", \"isWorkingDay\": true}, {\"day\": \"Terça-feira\", \"endTime\": \"18:00\", \"isDayOff\": true, \"lunchEnd\": \"13:00\", \"startTime\": \"09:00\", \"lunchStart\": \"12:00\", \"isWorkingDay\": true}, {\"day\": \"Quarta-feira\", \"endTime\": \"16:30\", \"isDayOff\": false, \"lunchEnd\": \"13:00\", \"startTime\": \"09:00\", \"lunchStart\": \"12:00\", \"isWorkingDay\": true}, {\"day\": \"Quinta-feira\", \"endTime\": \"16:30\", \"isDayOff\": false, \"lunchEnd\": \"13:00\", \"startTime\": \"09:00\", \"lunchStart\": \"12:00\", \"isWorkingDay\": true}, {\"day\": \"Sexta-feira\", \"endTime\": \"18:30\", \"isDayOff\": false, \"lunchEnd\": \"13:00\", \"startTime\": \"09:00\", \"lunchStart\": \"12:00\", \"isWorkingDay\": true}, {\"day\": \"Sábado\", \"endTime\": \"18:30\", \"isDayOff\": false, \"lunchEnd\": \"13:00\", \"startTime\": \"09:00\", \"lunchStart\": \"12:00\", \"isWorkingDay\": true}, {\"day\": \"Domingo\", \"endTime\": \"18:00\", \"isDayOff\": true, \"lunchEnd\": \"13:00\", \"startTime\": \"09:00\", \"lunchStart\": \"12:00\", \"isWorkingDay\": false}]', '2025-11-24 17:26:00', '2025-11-24 17:28:19', NULL),
(10, 8, '81984427680', '[\"Nail design\", \"Manicure\"]', 1, '[{\"day\": \"Segunda-feira\", \"endTime\": \"16:30\", \"isDayOff\": false, \"lunchEnd\": \"14:00\", \"startTime\": \"09:00\", \"lunchStart\": \"13:00\", \"isWorkingDay\": true}, {\"day\": \"Terça-feira\", \"endTime\": \"16:30\", \"isDayOff\": false, \"lunchEnd\": \"14:00\", \"startTime\": \"09:00\", \"lunchStart\": \"13:00\", \"isWorkingDay\": true}, {\"day\": \"Quarta-feira\", \"endTime\": \"16:30\", \"isDayOff\": false, \"lunchEnd\": \"14:00\", \"startTime\": \"09:00\", \"lunchStart\": \"13:00\", \"isWorkingDay\": true}, {\"day\": \"Quinta-feira\", \"endTime\": \"18:00\", \"isDayOff\": true, \"lunchEnd\": \"13:00\", \"startTime\": \"09:00\", \"lunchStart\": \"12:00\", \"isWorkingDay\": true}, {\"day\": \"Sexta-feira\", \"endTime\": \"18:30\", \"isDayOff\": false, \"lunchEnd\": \"13:00\", \"startTime\": \"09:00\", \"lunchStart\": \"12:00\", \"isWorkingDay\": true}, {\"day\": \"Sábado\", \"endTime\": \"18:30\", \"isDayOff\": false, \"lunchEnd\": \"13:00\", \"startTime\": \"09:00\", \"lunchStart\": \"12:00\", \"isWorkingDay\": true}, {\"day\": \"Domingo\", \"endTime\": \"18:00\", \"isDayOff\": true, \"lunchEnd\": \"13:00\", \"startTime\": \"09:00\", \"lunchStart\": \"12:00\", \"isWorkingDay\": false}]', '2025-11-24 17:32:29', '2025-11-24 17:32:29', NULL);

-- --------------------------------------------------------

--
-- Estrutura da tabela `professional_open_windows`
--

CREATE TABLE `professional_open_windows` (
  `id` bigint UNSIGNED NOT NULL,
  `professional_id` bigint UNSIGNED NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `status` enum('open','closed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'open',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Extraindo dados da tabela `professional_open_windows`
--

INSERT INTO `professional_open_windows` (`id`, `professional_id`, `start_date`, `end_date`, `status`, `created_at`, `updated_at`) VALUES
(15, 9, '2025-12-04', '2025-12-30', 'open', '2025-12-04 11:23:04', '2025-12-04 11:23:04'),
(18, 5, '2025-12-04', '2025-12-30', 'open', '2025-12-04 11:24:16', '2025-12-04 11:24:16'),
(20, 1, '2025-12-04', '2025-12-30', 'open', '2025-12-04 11:24:50', '2025-12-04 11:24:50'),
(22, 8, '2026-01-19', '2026-02-28', 'open', '2026-01-19 09:02:58', '2026-01-19 09:02:58'),
(23, 10, '2026-01-19', '2026-02-28', 'open', '2026-01-19 09:03:24', '2026-01-19 09:03:24'),
(24, 7, '2026-01-19', '2026-02-28', 'open', '2026-01-19 09:03:37', '2026-01-19 09:03:37'),
(25, 6, '2026-01-19', '2026-02-28', 'open', '2026-01-19 09:03:54', '2026-01-19 09:03:54'),
(26, 4, '2026-01-19', '2026-02-28', 'open', '2026-01-19 09:04:32', '2026-01-19 09:04:32'),
(27, 3, '2026-01-19', '2026-02-28', 'open', '2026-01-19 09:04:52', '2026-01-19 09:04:52'),
(28, 2, '2026-01-19', '2026-02-28', 'open', '2026-01-19 09:05:16', '2026-01-19 09:05:16'),
(29, 1, '2026-01-19', '2026-02-28', 'open', '2026-01-19 09:05:36', '2026-01-19 09:05:36'),
(30, 10, '2026-03-01', '2026-05-31', 'open', '2026-01-22 11:47:27', '2026-01-22 11:47:27'),
(31, 8, '2026-03-02', '2026-05-31', 'open', '2026-01-22 11:48:01', '2026-01-22 11:48:01'),
(32, 7, '2026-03-02', '2026-05-31', 'open', '2026-01-22 11:48:22', '2026-01-22 11:48:22'),
(33, 6, '2026-03-02', '2026-05-31', 'open', '2026-01-22 11:48:43', '2026-01-22 11:48:43'),
(34, 3, '2026-03-02', '2026-05-31', 'open', '2026-01-22 11:49:00', '2026-01-22 11:49:00'),
(35, 2, '2026-03-02', '2026-05-31', 'open', '2026-01-22 11:49:22', '2026-01-22 11:49:22'),
(36, 1, '2026-03-02', '2026-05-31', 'open', '2026-01-22 11:49:43', '2026-01-22 11:49:43');

-- --------------------------------------------------------

--
-- Estrutura da tabela `promotions`
--

CREATE TABLE `promotions` (
  `id` bigint UNSIGNED NOT NULL,
  `name` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `discount_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `discount_value` decimal(12,2) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `is_recurring` tinyint(1) NOT NULL DEFAULT '0',
  `recurrence_type` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recurrence_weekdays` json DEFAULT NULL,
  `recurrence_week_of_month` tinyint UNSIGNED DEFAULT NULL,
  `recurrence_month` tinyint UNSIGNED DEFAULT NULL,
  `recurrence_day_of_month` tinyint UNSIGNED DEFAULT NULL,
  `min_purchase_amount` decimal(12,2) DEFAULT NULL,
  `max_discount` decimal(12,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Extraindo dados da tabela `promotions`
--

INSERT INTO `promotions` (`id`, `name`, `description`, `discount_type`, `discount_value`, `start_date`, `end_date`, `active`, `is_recurring`, `recurrence_type`, `recurrence_weekdays`, `recurrence_week_of_month`, `recurrence_month`, `recurrence_day_of_month`, `min_purchase_amount`, `max_discount`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 'PROMOÇÃO DIA D', 'Toda segunda-feira é dia D dia de promoção, valores menos que a tabela de preço', 'fixed', 20.00, '2025-12-04', '2025-12-04', 1, 0, NULL, NULL, NULL, NULL, NULL, 80.00, 20.00, '2025-12-04 11:52:22', '2026-01-19 15:02:00', '2026-01-19 15:02:00'),
(2, 'PACOTES PROMOCIONAIS', 'DE FEVEREIRO A MAIO', 'fixed', 20.00, '2026-01-22', '2026-04-30', 1, 1, 'weekly', '[1, 2, 3, 4, 5, 6]', NULL, NULL, NULL, NULL, NULL, '2026-01-22 10:14:41', '2026-01-22 10:22:12', NULL);

-- --------------------------------------------------------

--
-- Estrutura da tabela `promotion_item`
--

CREATE TABLE `promotion_item` (
  `id` bigint UNSIGNED NOT NULL,
  `promotion_id` bigint UNSIGNED NOT NULL,
  `item_id` bigint UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura da tabela `promotion_service`
--

CREATE TABLE `promotion_service` (
  `id` bigint UNSIGNED NOT NULL,
  `promotion_id` bigint UNSIGNED NOT NULL,
  `service_id` bigint UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura da tabela `roles`
--

CREATE TABLE `roles` (
  `id` bigint UNSIGNED NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Extraindo dados da tabela `roles`
--

INSERT INTO `roles` (`id`, `name`, `slug`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 'Administrador', 'admin', '2025-11-23 02:18:55', '2025-11-23 02:18:55', NULL),
(2, 'Gerente', 'manager', '2025-11-23 02:18:55', '2025-11-23 02:18:55', NULL),
(3, 'Profissional', 'professional', '2025-11-23 02:18:55', '2025-11-23 02:18:55', NULL),
(4, 'Recepcionista', 'receptionist', '2025-11-23 02:18:55', '2025-11-23 02:18:55', NULL);

-- --------------------------------------------------------

--
-- Estrutura da tabela `role_user`
--

CREATE TABLE `role_user` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `role_id` bigint UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Extraindo dados da tabela `role_user`
--

INSERT INTO `role_user` (`id`, `user_id`, `role_id`, `created_at`, `updated_at`) VALUES
(1, 1, 1, NULL, NULL),
(2, 2, 1, NULL, NULL),
(3, 3, 1, NULL, NULL),
(4, 4, 1, NULL, NULL),
(5, 5, 3, NULL, NULL),
(6, 6, 3, NULL, NULL),
(7, 7, 3, NULL, NULL),
(8, 8, 3, NULL, NULL),
(9, 9, 3, NULL, NULL),
(10, 10, 3, NULL, NULL),
(11, 11, 1, NULL, NULL);

-- --------------------------------------------------------

--
-- Estrutura da tabela `screens`
--

CREATE TABLE `screens` (
  `id` bigint UNSIGNED NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Extraindo dados da tabela `screens`
--

INSERT INTO `screens` (`id`, `name`, `slug`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 'Dashboard', 'dashboard', '2025-11-23 02:18:55', '2025-11-23 02:18:55', NULL),
(2, 'Usuários', 'users', '2025-11-23 02:18:55', '2025-11-23 02:18:55', NULL),
(3, 'Papéis', 'roles', '2025-11-23 02:18:55', '2025-11-23 02:18:55', NULL),
(4, 'Telas', 'screens', '2025-11-23 02:18:55', '2025-11-23 02:18:55', NULL),
(5, 'Ações', 'actions', '2025-11-23 02:18:55', '2025-11-23 02:18:55', NULL),
(6, 'Permissões', 'permissions', '2025-11-23 02:18:55', '2025-11-23 02:18:55', NULL),
(7, 'Serviços', 'services', '2025-11-23 02:18:55', '2025-11-23 02:18:55', NULL),
(8, 'Profissionais', 'professionals', '2025-11-23 02:18:55', '2025-11-23 02:18:55', NULL),
(9, 'Clientes', 'customers', '2025-11-23 02:18:55', '2025-11-23 02:18:55', NULL),
(10, 'Fornecedores', 'suppliers', '2025-11-23 02:18:55', '2025-11-23 02:18:55', NULL),
(11, 'Itens', 'items', '2025-11-23 02:18:55', '2025-11-23 02:18:55', NULL),
(12, 'Promoções', 'promotions', '2025-11-23 02:18:55', '2025-11-23 02:18:55', NULL),
(13, 'Agendamentos', 'appointments', '2025-11-23 02:18:55', '2025-11-23 02:18:55', NULL),
(14, 'Comissões', 'commissions', '2025-11-23 02:18:55', '2025-11-23 02:18:55', NULL),
(15, 'Caixa', 'cashier', '2025-11-23 02:18:55', '2025-11-23 02:18:55', NULL),
(16, 'Contas a pagar', 'accounts-payable', '2025-11-23 02:18:55', '2025-11-23 02:18:55', NULL),
(17, 'Preços de itens', 'item-prices', '2025-11-23 02:18:55', '2025-11-23 02:18:55', NULL),
(18, 'Histórico de preços de itens', 'item-price-histories', '2025-11-23 02:18:55', '2025-11-23 02:18:55', NULL);

-- --------------------------------------------------------

--
-- Estrutura da tabela `services`
--

CREATE TABLE `services` (
  `id` bigint UNSIGNED NOT NULL,
  `name` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `price` decimal(12,2) NOT NULL,
  `duration` int UNSIGNED NOT NULL,
  `category` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `commission_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `commission_value` decimal(12,2) NOT NULL DEFAULT '0.00',
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Extraindo dados da tabela `services`
--

INSERT INTO `services` (`id`, `name`, `description`, `price`, `duration`, `category`, `commission_type`, `commission_value`, `active`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 'Designer de corte', 'mandar inspiração via zap', 50.00, 30, 'Cabelo', 'percentage', 40.00, 1, '2025-11-24 17:38:48', '2025-11-24 17:38:48', NULL),
(2, 'progressiva Aminoacído tamanho (P)', 'Existe incompatibilidade de produtos, sua progressiva é formol ou Aminoacidos.\nA progressiva feita a cada 3 meses verifique o tempo da sua. ', 140.00, 120, 'Cabelo', 'percentage', 40.00, 1, '2025-11-24 17:46:54', '2025-11-24 18:28:47', NULL),
(3, 'progressiva Aminoacido  tamanho (M)', 'Existe incompatibilidade de produto, sua progressiva é formol ou Aminoacidos? \nA progressiva tem o tempo de durabilidade 3 meses.', 170.00, 120, 'Cabelo', 'percentage', 40.00, 1, '2025-11-24 17:54:48', '2025-11-24 17:55:19', NULL),
(4, 'progressiva Aminoacído tamanho (G)', 'Existe incompatibilidade de produtos, sua progressiva é formol ou Aminoacidos?\nA progressiva feita a cada 3 meses verifique o tempo da sua. ', 200.00, 120, 'Cabelo', 'percentage', 40.00, 1, '2025-11-24 18:00:00', '2025-11-24 18:00:00', NULL),
(5, 'progressiva Aminoacído tamanho (G)', 'Existe incompatibilidade de produtos, sua progressiva é formol ou Aminoacidos?\nA progressiva feita a cada 3 meses verifique o tempo da sua. ', 200.00, 120, 'Cabelo', 'percentage', 40.00, 1, '2025-11-24 18:00:01', '2025-11-24 18:00:51', '2025-11-24 18:00:51'),
(6, 'progressiva Aminoacído tamanho (GG)', 'Existe incompatibilidade de produtos, sua progressiva é formol ou Aminoacidos?progressiva feita a cada 3 meses verifique o tempo da sua. ', 250.00, 120, 'Cabelo', 'percentage', 40.00, 1, '2025-11-24 18:17:19', '2025-11-24 18:29:53', NULL),
(7, 'Selagem Aminoacído tamanho (P)', 'Existe incompatibilidade de produtos, sua Selagem é formol ou Aminoacidos? Selagem feita a cada 3 meses verifique o tempo da sua. ', 90.00, 120, 'Cabelo', 'percentage', 40.00, 1, '2025-11-24 18:18:53', '2025-11-24 18:30:21', NULL),
(8, 'Selagem Aminoacído tamanho (M)', 'Existe incompatibilidade de produtos, sua Selagem é formol ou Aminoacidos? \nA Selagem é feita a cada 3 meses verifique o tempo da sua. ', 110.00, 120, 'Cabelo', 'percentage', 40.00, 1, '2025-11-24 18:23:23', '2025-11-24 18:30:51', NULL),
(9, 'Selagem Aminoacído tamanho (G)', 'Existe incompatibilidade de produtos, sua Selagem é formol ou Aminoacidos? \nA Selagem é feita a cada 3 meses verifique o tempo da sua. ', 130.00, 120, 'Cabelo', 'percentage', 40.00, 1, '2025-11-24 18:25:16', '2025-11-24 18:31:10', NULL),
(10, 'Selagem Aminoacído tamanho (GG)', 'Existe incompatibilidade de produtos, sua Selagem é formol ou Aminoacidos? A Selagem é feita a cada 3 meses verifique o tempo da sua. ', 0.00, 120, 'Cabelo', 'percentage', 40.00, 1, '2025-11-24 18:27:12', '2025-11-25 09:36:28', NULL),
(11, 'Botox Aminoacído tamanho (P)', 'Existe incompatibilidade de produtos, seu Botox é formol ou Aminoacidos? O Botox feita a cada 3 meses verifique o tempo do seu. ', 90.00, 120, 'Cabelo', 'percentage', 40.00, 1, '2025-11-25 09:42:10', '2025-11-25 09:43:35', NULL),
(12, 'Botox Aminoacído tamanho (M)', 'Existe incompatibilidade de produtos, seu Botox é formol ou Aminoacidos? O Botox feita a cada 3 meses verifique o tempo do seu. ', 100.00, 120, 'Cabelo', 'percentage', 40.00, 1, '2025-11-25 09:43:19', '2025-11-25 09:43:19', NULL),
(13, 'Botox Aminoacído tamanho (G)', 'Existe incompatibilidade de produtos, seu Botox é formol ou Aminoacidos? O Botox feita a cada 3 meses verifique o tempo do seu. ', 120.00, 120, 'Cabelo', 'percentage', 40.00, 1, '2025-11-25 09:45:34', '2025-11-25 09:45:34', NULL),
(14, 'Botox Aminoacído tamanho (GG)', 'Existe incompatibilidade de produtos, seu Botox é formol ou Aminoacidos? O Botox feita a cada 3 meses verifique o tempo do seu. ', 150.00, 120, 'Cabelo', 'percentage', 40.00, 1, '2025-11-25 09:46:23', '2025-11-25 09:46:23', NULL),
(15, 'Fulani Braids', 'Para fazer o alongamento precisa vim com o cabelo lavado e seco, sem nenhum produto.\ntodo alongamento precisar ter os cuidados necessarios consulte sua trancista.', 300.00, 480, 'Trança', 'percentage', 40.00, 1, '2025-11-25 09:57:42', '2025-11-25 13:37:15', NULL),
(16, 'Fulani Braids c/ cachos', 'Para fazer o alongamento precisa vim com o cabelo lavado e seco, sem nenhum produto.\ntodo alongamento precisar ter os cuidados necessarios consulte sua trancista.', 300.00, 480, 'Trança', 'percentage', 40.00, 1, '2025-11-25 09:58:56', '2025-11-25 13:37:47', NULL),
(17, 'Box Braids', 'Para fazer o alongamento precisa vim com o cabelo lavado e seco, sem nenhum produto.\ntodo alongamento precisar ter os cuidados necessarios consulte sua trancista.', 300.00, 480, 'Trança', 'percentage', 40.00, 1, '2025-11-25 09:59:48', '2025-11-25 13:38:08', NULL),
(18, 'Box Braids c/ cachos', 'Para fazer o alongamento precisa vim com o cabelo lavado e seco, sem nenhum produto.\ntodo alongamento precisar ter os cuidados necessarios consulte sua trancista.', 300.00, 480, 'Trança', 'percentage', 40.00, 1, '2025-11-25 10:01:13', '2025-11-25 13:38:29', NULL),
(19, 'Crochet Brais', 'Para fazer o alongamento precisa vim com o cabelo lavado e seco, sem nenhum produto.\ntodo alongamento precisar ter os cuidados necessarios consulte sua trancista.', 300.00, 30, 'Trança', 'percentage', 40.00, 1, '2025-11-25 10:03:04', '2025-11-25 13:39:19', NULL),
(20, 'Ghana Braids', 'Para fazer o alongamento precisa vim com o cabelo lavado e seco, sem nenhum produto.\ntodo alongamento precisar ter os cuidados necessarios consulte sua trancista.', 150.00, 240, 'Trança', 'percentage', 40.00, 1, '2025-11-25 10:04:01', '2025-11-25 13:39:42', NULL),
(21, 'Boho Braids', 'Para fazer o alongamento precisa vim com o cabelo lavado e seco, sem nenhum produto.\ntodo alongamento precisar ter os cuidados necessarios consulte sua trancista.', 300.00, 480, 'Trança', 'percentage', 40.00, 1, '2025-11-25 10:04:42', '2025-11-25 13:40:05', NULL),
(22, 'Twiste Braids', 'Para fazer o alongamento precisa vim com o cabelo lavado e seco, sem nenhum produto.\ntodo alongamento precisar ter os cuidados necessarios consulte sua trancista.', 300.00, 480, 'Trança', 'percentage', 40.00, 1, '2025-11-25 10:05:24', '2025-11-25 13:36:35', NULL),
(23, 'Locs Braids', 'Para fazer o alongamento precisa vim com o cabelo lavado e seco, sem nenhum produto.\ntodo alongamento precisar ter os cuidados necessarios consulte sua trancista.', 300.00, 480, 'Trança', 'percentage', 40.00, 1, '2025-11-25 10:06:45', '2025-11-25 13:36:48', NULL),
(24, 'Ghana Braids c/ cachos', 'Para fazer o alongamento precisa vim com o cabelo lavado e seco, sem nenhum produto.\ntodo alongamento precisar ter os cuidados necessarios consulte sua trancista.', 150.00, 240, 'Trança', 'percentage', 40.00, 1, '2025-11-25 10:08:01', '2025-11-25 13:36:22', NULL),
(25, 'Escova e chapinha (P) ', 'Lavagem+tratamento simples', 40.00, 60, 'Cabelo', 'percentage', 40.00, 1, '2025-11-25 13:24:00', '2025-11-25 13:30:50', NULL),
(26, 'Escova e chapinha (M) ', 'Lavagem+tratamento simples', 45.00, 60, 'Cabelo', 'percentage', 40.00, 1, '2025-11-25 13:24:00', '2025-11-25 13:31:33', NULL),
(27, 'Escova e chapinha (G) ', 'Lavagem+tratamento simples', 50.00, 60, 'Cabelo', 'percentage', 40.00, 1, '2025-11-25 13:24:00', '2025-11-25 13:31:58', NULL),
(28, 'Escova e chapinha (GG) ', 'Lavagem+tratamento simples', 60.00, 30, 'Cabelo', 'percentage', 40.00, 1, '2025-11-25 13:27:27', '2025-11-25 13:34:38', NULL),
(29, 'Escova e chapinha (Mega)', 'Lavagem+tratamento simples', 80.00, 60, 'Cabelo', 'percentage', 40.00, 1, '2025-11-25 13:29:21', '2025-11-25 13:36:04', NULL),
(30, 'Progressiva formol tamanho (P)', 'Existe incompatibilidade de produtos, sua progressiva é formol ou Aminoacidos ?\nA progressiva feita a cada 3 meses verifique o tempo da sua. ', 160.00, 120, 'Cabelo', 'percentage', 40.00, 1, '2025-11-25 13:59:35', '2025-11-25 13:59:35', NULL),
(31, 'Progressiva formol tamanho (M)', 'Existe incompatibilidade de produtos, sua progressiva é formol ou Aminoacidos ?\nA progressiva feita a cada 3 meses verifique o tempo da sua. ', 180.00, 120, 'Cabelo', 'percentage', 40.00, 1, '2025-11-25 14:01:23', '2025-11-25 14:01:23', NULL),
(32, 'Progressiva formol tamanho (G)', 'Existe incompatibilidade de produtos, sua progressiva é formol ou Aminoacidos ?\nA progressiva feita a cada 3 meses verifique o tempo da sua. ', 220.00, 120, 'Cabelo', 'percentage', 40.00, 1, '2025-11-25 14:02:24', '2025-11-25 14:02:24', NULL),
(33, 'Progressiva formol tamanho (GG)', 'Existe incompatibilidade de produtos, sua progressiva é formol ou Aminoacidos ?\nA progressiva feita a cada 3 meses verifique o tempo da sua. ', 270.00, 120, 'Cabelo', 'percentage', 40.00, 1, '2025-11-25 14:03:41', '2025-11-25 14:03:41', NULL),
(34, 'Progressiva formol tamanho (Mega)', 'Existe incompatibilidade de produtos, sua progressiva é formol ou Aminoacidos ?\nA progressiva feita a cada 3 meses verifique o tempo da sua. ', 300.00, 120, 'Cabelo', 'percentage', 40.00, 1, '2025-11-25 14:04:26', '2025-11-25 14:04:26', NULL),
(35, 'Selagem Formol tamanho (P)', 'Existe incompatibilidade de produtos, sua Selagem é formol ou Aminoacidos ?\nA Selagem feita a cada 3 meses verifique o tempo da sua. ', 100.00, 120, 'Cabelo', 'percentage', 40.00, 1, '2025-11-25 14:09:20', '2025-11-25 14:09:20', NULL),
(36, 'Selagem Formol tamanho (M)', 'Existe incompatibilidade de produtos, sua Selagem é formol ou Aminoacidos ?\nA Selagem feita a cada 3 meses verifique o tempo da sua. ', 120.00, 30, 'Cabelo', 'percentage', 40.00, 1, '2025-11-25 14:10:35', '2025-11-25 14:10:35', NULL),
(37, 'Selagem Formol tamanho (G)', 'Existe incompatibilidade de produtos, sua Selagem é formol ou Aminoacidos ?\nA Selagem feita a cada 3 meses verifique o tempo da sua. ', 140.00, 120, 'Cabelo', 'percentage', 40.00, 1, '2025-11-25 14:12:47', '2025-11-25 14:13:24', NULL),
(38, 'Selagem Formol tamanho (GG)', 'Existe incompatibilidade de produtos, sua Selagem é formol ou Aminoacidos ?\nA Selagem feita a cada 3 meses verifique o tempo da sua. ', 170.00, 120, 'Cabelo', 'percentage', 40.00, 1, '2025-11-25 14:14:55', '2025-11-25 14:14:55', NULL),
(39, 'Selagem Formol tamanho (Mega)', 'Existe incompatibilidade de produtos, sua Selagem é formol ou Aminoacidos ?\nA Selagem feita a cada 3 meses verifique o tempo da sua. ', 200.00, 120, 'Cabelo', 'percentage', 40.00, 1, '2025-11-25 14:18:05', '2025-11-25 14:18:05', NULL),
(40, 'Botox Formol tamanho (P)', 'Existe incompatibilidade de produtos, seu Botox é formol ou Aminoacidos ?\nO Botox é feita a cada 3 meses verifique o tempo do seu. ', 100.00, 120, 'Cabelo', 'percentage', 40.00, 1, '2025-11-25 14:20:23', '2025-11-25 14:21:44', NULL),
(41, 'Botox Formol tamanho (M)', 'Existe incompatibilidade de produtos, seu Botox é formol ou Aminoacidos ?\nO Botox é feita a cada 3 meses verifique o tempo do seu. ', 120.00, 120, 'Cabelo', 'percentage', 40.00, 1, '2025-11-25 14:21:29', '2025-11-25 14:21:29', NULL),
(42, 'Botox Formol tamanho (G)', 'Existe incompatibilidade de produtos, seu Botox é formol ou Aminoacidos ?\nO Botox é feita a cada 3 meses verifique o tempo do seu. ', 140.00, 120, 'Cabelo', 'percentage', 40.00, 1, '2025-11-25 14:22:43', '2025-11-25 14:22:43', NULL),
(43, 'Botox Formol tamanho (GG)', 'Existe incompatibilidade de produtos, seu Botox é formol ou Aminoacidos ?\nO Botox é feita a cada 3 meses verifique o tempo do seu. ', 170.00, 120, 'Cabelo', 'percentage', 40.00, 1, '2025-11-25 14:23:43', '2025-11-25 14:23:43', NULL),
(44, 'luzes (Mechas) tamanho (P)', 'para efetuar esse procedimente é necessario fazer o teste de mechas, entre em contato com a sua cabelereira para agendar.', 350.00, 240, 'Cabelo', 'percentage', 0.00, 1, '2025-11-25 14:27:49', '2026-01-19 15:43:42', NULL),
(45, 'luzes (Mechas) tamanho (M)', 'Para efetuar esse procedimente é necessario fazer o teste de mechas, entre em contato com a sua cabelereira para agendar.', 400.00, 240, 'Cabelo', 'percentage', 0.00, 1, '2025-11-25 14:29:14', '2026-01-19 15:43:25', NULL),
(46, 'luzes (Mechas) tamanho (G)', 'Para efetuar esse procedimente é necessario fazer o teste de mechas, entre em contato com a sua cabelereira para agendar.', 450.00, 240, 'Cabelo', 'percentage', 0.00, 1, '2025-11-25 14:29:58', '2026-01-19 15:42:26', NULL),
(47, 'luzes (Mechas) tamanho (GG)', 'Para efetuar esse procedimente é necessario fazer o teste de mechas, entre em contato com a sua cabelereira para agendar.', 500.00, 240, 'Cabelo', 'percentage', 0.00, 1, '2025-11-25 14:30:45', '2026-01-19 15:43:00', NULL),
(48, 'Massagem relaxante', 'A massagem relaxante tem durabilidade de 1 hora', 60.00, 60, 'Estética', 'percentage', 40.00, 1, '2025-11-25 14:32:44', '2025-11-25 14:32:44', NULL),
(49, 'Massagem podal', 'Massagem nos pés', 35.00, 30, 'Estética', 'percentage', 40.00, 1, '2025-11-25 14:33:34', '2025-11-25 14:33:34', NULL),
(50, 'Ventozas, Pedras ou Velas', 'A massagem relaxante com as Ventozas, pedras ou velas de até 1 hora.', 60.00, 40, 'Estética', 'percentage', 40.00, 1, '2025-11-25 14:37:50', '2025-11-25 16:58:17', NULL),
(51, 'Combo Massagem+Ventoza+podal', 'A massagem relaxante completa da cabeça aos pés. tem durabilidade de até 01:20', 100.00, 80, 'Estética', 'percentage', 40.00, 1, '2025-11-25 14:42:17', '2025-11-25 14:42:17', NULL),
(52, 'Escalda pés terapeutico com ervas medicinais', 'O escalda pés terapeutico tem a função de desinchar, desinflamar e ajudar na má circulação sanguinea.', 35.00, 45, 'Estética', 'percentage', 40.00, 1, '2025-11-25 14:46:23', '2025-11-25 14:46:23', NULL),
(53, 'Spa relaxante com Gelatina de açai ou saís minerais', 'o Spa relaxante tem a função reduzir o estresse a ansiedade, promover relaxamento fisico e mental e melhorar o bem-estar.', 35.00, 45, 'Estética', 'percentage', 40.00, 1, '2025-11-25 14:52:22', '2025-11-26 11:48:46', NULL),
(54, 'Epilação meia perna ', 'A Epilação é feita uma vez no mês', 45.00, 45, 'Estética', 'percentage', 40.00, 1, '2025-11-25 14:56:19', '2025-11-25 14:56:19', NULL),
(55, 'Spa relaxante com Gelatina de açai ou saís minerall', 'O spa relaxante combate o estresse a ansiedade promove bem-estar fisico e mental.', 35.00, 30, 'Estética', 'percentage', 40.00, 1, '2025-11-25 17:04:11', '2025-11-26 11:48:13', '2025-11-26 11:48:13'),
(56, 'teste', 'teste', 0.00, 30, 'Cabelo', 'percentage', 40.00, 1, '2025-11-25 17:12:25', '2025-11-26 10:11:41', '2025-11-26 10:11:41'),
(57, 'Epilação axila ', 'Epilação é feita apos 30 dias,não use gilete.', 30.00, 45, 'Estética', 'percentage', 40.00, 1, '2025-11-25 17:58:10', '2025-11-25 17:58:10', NULL),
(58, 'Epilação Virilia', 'Epilação é feita apos 30 dias,não use gilete.', 30.00, 45, 'Estética', 'percentage', 40.00, 1, '2025-11-25 17:58:50', '2025-11-25 17:58:50', NULL),
(59, 'Epilação intima completa', 'Epilação é feita apos 30 dias,não use gilete.', 60.00, 45, 'Estética', 'percentage', 40.00, 1, '2025-11-25 17:59:29', '2025-11-25 17:59:29', NULL),
(60, 'Limpeza de pele simples', 'Ajude a saúde da sua pele', 100.00, 60, 'Estética', 'percentage', 40.00, 1, '2025-11-25 18:00:32', '2025-11-25 18:00:32', NULL),
(61, 'Design personalizado', 'A sobrancelha é a moldura do rosto, cuide bem dela', 25.00, 30, 'Sobrancelha', 'percentage', 40.00, 1, '2025-11-25 18:02:59', '2025-11-25 18:02:59', NULL),
(62, 'Design com Henna', 'A sobrancelha é a moldura do rosto, cuide bem dela', 35.00, 30, 'Sobrancelha', 'percentage', 40.00, 1, '2025-11-25 18:09:13', '2025-11-25 18:09:13', NULL),
(63, 'Design com coloração de pelos brancos', 'A sobrancelha é a moldura do rosto, cuide bem dela', 35.00, 30, 'Sobrancelha', 'percentage', 40.00, 1, '2025-11-25 18:11:49', '2025-11-25 18:11:49', NULL),
(64, 'Epilação Buço', 'Epilação é vida', 15.00, 30, 'Sobrancelha', 'percentage', 40.00, 1, '2025-11-25 18:13:19', '2025-11-26 11:50:16', NULL),
(65, 'Epilação mento', 'Epilação é vida', 15.00, 30, 'Sobrancelha', 'percentage', 40.00, 1, '2025-11-25 18:14:09', '2025-11-25 18:14:09', NULL),
(66, 'Cílios (diversos modelos)', 'Todos modelos disponiveis com o mesmo valor consultar foto.', 120.00, 120, 'Sobrancelha', 'percentage', 40.00, 1, '2025-11-25 18:17:26', '2025-11-25 18:17:26', NULL),
(67, 'Gel aplicação (tip)', 'Aplicação de gel', 120.00, 120, 'Unhas', 'percentage', 40.00, 1, '2025-11-26 12:24:41', '2025-11-26 12:24:41', NULL),
(68, 'Gel aplicação (fibra)', 'fibra de vidro', 140.00, 120, 'Unhas', 'percentage', 40.00, 1, '2025-11-26 12:26:18', '2025-11-26 12:26:18', NULL),
(69, 'Gel manutenção (Tip)', 'manutenção', 80.00, 120, 'Unhas', 'percentage', 40.00, 1, '2025-11-26 12:27:49', '2025-11-26 13:23:03', NULL),
(70, 'Gel manutenção (fibra)', 'manutenção fibra de vidro', 100.00, 120, 'Unhas', 'percentage', 40.00, 1, '2025-11-26 12:31:31', '2025-11-26 12:31:31', NULL),
(71, 'Blindagem com cutilagem', 'Blindagem é uma camada superficial de Gel que traz resistência e durabilidade a esmaltação.', 60.00, 60, 'Unhas', 'percentage', 40.00, 1, '2025-11-26 12:35:46', '2025-11-26 12:35:46', NULL),
(72, 'Blindagem sem  cutilagem', 'Blindagem é uma camada superficial de Gel que traz resistência e durabilidade a esmaltação.', 50.00, 45, 'Unhas', 'percentage', 40.00, 1, '2025-11-26 12:37:07', '2025-11-26 12:37:07', NULL),
(73, 'Postiça realista com cutilagem', 'Durabilidade de até 20 dias', 60.00, 60, 'Unhas', 'percentage', 40.00, 1, '2025-11-26 12:38:31', '2025-11-26 12:38:31', NULL),
(74, 'Postiça realista sem cutilagem', 'Durabilidade de até 20 dias', 50.00, 45, 'Unhas', 'percentage', 40.00, 1, '2025-11-26 12:39:29', '2025-11-26 12:39:29', NULL),
(75, 'Remoção de Gel', 'Não faça remoção sozinha (o) procure uma proficional.', 30.00, 20, 'Unhas', 'percentage', 40.00, 1, '2025-11-26 12:41:23', '2025-11-26 12:41:23', NULL),
(76, 'Manicure ', 'Cutilagem + esmaltação', 30.00, 30, 'Unhas', 'percentage', 40.00, 1, '2025-11-26 12:43:12', '2025-11-26 12:43:12', NULL),
(77, 'Pedicure', 'Cutilagem + esmaltação', 30.00, 30, 'Unhas', 'percentage', 40.00, 1, '2025-11-26 12:44:04', '2025-11-26 12:44:04', NULL),
(78, 'Pé e mão ', 'Cutilagem + esmaltção', 50.00, 60, 'Unhas', 'percentage', 40.00, 1, '2025-11-26 12:45:09', '2025-11-26 12:45:09', NULL),
(79, 'Cutilagem de Gel', ' cutilagem sem esmaltação para as mãos com Gel', 20.00, 30, 'Unhas', 'percentage', 40.00, 1, '2025-11-26 12:48:51', '2025-11-26 12:48:51', NULL),
(80, 'Esmaltação em Gel', 'Esmatação em Gel sem cutilagem e sem manutenção.', 15.00, 30, 'Unhas', 'percentage', 40.00, 1, '2025-11-26 12:50:18', '2025-11-26 12:50:18', NULL),
(81, 'Esmaltação comum', 'esmalte comum', 10.00, 30, 'Unhas', 'percentage', 40.00, 1, '2025-11-26 12:51:07', '2025-11-26 12:51:07', NULL),
(82, 'Esmaltação comum + francesinha', 'esmalte comum', 15.00, 30, 'Unhas', 'percentage', 40.00, 1, '2025-11-26 12:51:48', '2025-11-26 12:51:48', NULL),
(83, 'esmatação comum + decoração', 'Pedrarias, pelicula, glitter', 15.00, 30, 'Unhas', 'percentage', 40.00, 1, '2025-11-26 13:00:05', '2025-11-26 13:00:05', NULL),
(84, 'Esmaltação em Gel + Decoração', 'pedrarias pelicula glitter', 20.00, 35, 'Unhas', 'percentage', 40.00, 1, '2025-11-26 13:01:36', '2025-11-26 13:01:36', NULL),
(85, 'Combo pé e mao + plastica dos pés ou Spa dos pés', 'voçê  sabe a diferença entre a plastica dos pés e o Spa dos pés? se não; consulte sua manicure.', 80.00, 120, 'Unhas', 'percentage', 40.00, 1, '2025-11-26 13:12:32', '2025-11-26 13:12:32', NULL),
(86, 'combo promocional Cilios+sobrancelhas', 'Combo', 100.00, 120, 'Sobrancelha', 'percentage', 40.00, 1, '2025-11-26 13:39:21', '2025-11-26 13:39:21', NULL),
(87, 'combo promocional Cilios+sobrancelhas', 'Combo', 100.00, 120, 'Sobrancelha', 'percentage', 40.00, 1, '2025-11-26 13:39:21', '2025-11-26 13:39:21', NULL),
(88, 'Blindagem com cutilagem', 'blindagem', 60.00, 30, 'Unhas', 'percentage', 40.00, 1, '2025-12-02 20:36:21', '2025-12-02 20:36:21', NULL),
(89, 'Cronograma Grati 1 seção  (P)', 'já pago', 50.00, 60, 'Cabelo', 'percentage', 40.00, 1, '2025-12-03 12:27:31', '2025-12-03 12:29:37', NULL),
(90, 'Cronograma Grati 2 seção  (P)', 'já pago', 50.00, 60, 'Cabelo', 'percentage', 40.00, 1, '2025-12-03 12:30:15', '2025-12-03 12:31:25', NULL),
(91, 'Cronograma Grati 3 seção  (P)', 'Já pago', 50.00, 60, 'Cabelo', 'percentage', 40.00, 1, '2025-12-03 12:31:01', '2025-12-03 12:31:33', NULL),
(92, 'Cronograma Grati 4 seção  (P)', 'já pago', 0.00, 60, 'Cabelo', 'percentage', 40.00, 1, '2025-12-03 12:32:43', '2025-12-03 12:32:43', NULL),
(93, 'Cronograma Grati 5 seção  (P)', 'já pago', 50.00, 60, 'Cabelo', 'percentage', 40.00, 1, '2025-12-03 12:33:30', '2025-12-03 12:33:30', NULL),
(94, 'Cronograma Grati 1 seção  (M)', 'já pago', 55.00, 60, 'Cabelo', 'percentage', 40.00, 1, '2025-12-03 12:34:48', '2025-12-03 12:35:51', NULL),
(95, 'Cronograma Grati 2 seção  (M)', 'já pago', 55.00, 60, 'Cabelo', 'percentage', 40.00, 1, '2025-12-03 12:35:28', '2025-12-03 12:35:28', NULL),
(96, 'Cronograma Grati 3 seção  (M)', 'já pago', 55.00, 60, 'Cabelo', 'percentage', 40.00, 1, '2025-12-03 12:36:27', '2025-12-03 12:49:43', NULL),
(97, 'Cronograma Grati 4 seção  (M)', 'já pago', 55.00, 60, 'Cabelo', 'percentage', 40.00, 1, '2025-12-03 12:36:58', '2025-12-03 12:36:58', NULL),
(98, 'Cronograma Grati 5 seção  (M)', 'já pago', 55.00, 60, 'Cabelo', 'percentage', 40.00, 1, '2025-12-03 12:37:33', '2025-12-03 13:23:43', NULL),
(99, 'Cronograma Grati 1 seção  (G)', 'já pago', 60.00, 60, 'Cabelo', 'percentage', 40.00, 1, '2025-12-03 12:39:03', '2025-12-03 12:39:03', NULL),
(100, 'Cronograma Grati  2 seção  (G)', 'já pago', 60.00, 60, 'Cabelo', 'percentage', 40.00, 1, '2025-12-03 12:39:42', '2025-12-03 12:47:57', NULL),
(101, 'Cronograma Grati 3 seção  (G)', 'já pago', 60.00, 60, 'Cabelo', 'percentage', 40.00, 1, '2025-12-03 12:40:13', '2025-12-03 12:49:38', NULL),
(102, 'Cronograma Grati 4 seção  (G)', 'já pago', 60.00, 60, 'Cabelo', 'percentage', 40.00, 1, '2025-12-03 12:40:54', '2025-12-03 12:40:54', NULL),
(103, 'Cronograma Grati 5 seção  (G)', 'já pago', 60.00, 60, 'Cabelo', 'percentage', 40.00, 1, '2025-12-03 12:41:49', '2025-12-03 12:41:49', NULL),
(104, 'Cronograma Grati 1 seção  (GG)', 'já pago', 65.00, 60, 'Cabelo', 'percentage', 40.00, 1, '2025-12-03 12:42:53', '2025-12-03 12:42:53', NULL),
(105, 'Cronograma Grati 2 seção  (GG)', 'já pago', 65.00, 60, 'Cabelo', 'percentage', 40.00, 1, '2025-12-03 12:43:27', '2025-12-03 12:43:27', NULL),
(106, 'Cronograma Grati 3 seção  (GG)', 'já pago', 65.00, 60, 'Cabelo', 'percentage', 40.00, 1, '2025-12-03 12:43:59', '2025-12-03 12:43:59', NULL),
(107, 'Cronograma Grati 4 seção  (GG)', 'já pago', 65.00, 60, 'Cabelo', 'percentage', 40.00, 1, '2025-12-03 12:45:16', '2025-12-03 12:45:16', NULL),
(108, 'Cronograma Grati 5 seção  (GG)', 'já pago', 65.00, 60, 'Cabelo', 'percentage', 40.00, 1, '2025-12-03 12:45:50', '2025-12-03 12:45:50', NULL),
(109, 'Cronograma Grati 1 seção  (Mega)', 'já pago', 80.00, 60, 'Cabelo', 'percentage', 40.00, 1, '2025-12-03 12:46:30', '2025-12-03 12:46:30', NULL),
(110, 'Cronograma Grati 2 seção  (Mega)', 'já pago', 80.00, 60, 'Cabelo', 'percentage', 40.00, 1, '2025-12-03 12:47:17', '2025-12-03 12:47:17', NULL),
(111, 'Cronograma Grati 3 seção  (Mega)', 'já pago', 80.00, 60, 'Cabelo', 'percentage', 40.00, 1, '2025-12-03 12:47:42', '2025-12-03 12:47:42', NULL),
(112, 'Cronograma Grati 4 seção  (Mega)', 'já pago', 80.00, 60, 'Cabelo', 'percentage', 40.00, 1, '2025-12-03 12:48:54', '2025-12-03 12:48:54', NULL),
(113, 'Cronograma Grati 5 seção  (Mega)', 'já pago', 80.00, 60, 'Cabelo', 'percentage', 40.00, 1, '2025-12-03 12:49:31', '2025-12-03 13:23:35', NULL),
(114, 'Cronograma Wella 1 seção  (P)', 'já pago', 83.35, 60, 'Cabelo', 'percentage', 40.00, 1, '2025-12-03 13:19:36', '2025-12-03 13:26:16', NULL),
(115, 'Cronograma Wella 2 seção  (P)', 'já pago', 83.35, 30, 'Cabelo', 'percentage', 40.00, 1, '2025-12-03 13:20:11', '2025-12-03 13:26:28', NULL),
(116, 'Cronograma Wella 3 seção  (P)', 'já pago', 83.35, 60, 'Cabelo', 'percentage', 40.00, 1, '2025-12-03 13:20:51', '2025-12-03 13:26:59', NULL),
(117, 'Cronograma Wella 1 seção  (M)', 'já pago', 100.00, 60, 'Cabelo', 'percentage', 40.00, 1, '2025-12-03 13:21:45', '2025-12-03 13:23:18', NULL),
(118, 'Cronograma Wella 2 seção  (M)', 'já pago', 100.00, 60, 'Cabelo', 'percentage', 40.00, 1, '2025-12-03 13:22:27', '2025-12-03 13:22:27', NULL),
(119, 'Cronograma Wella 3 seção  (M)', 'já pago', 100.00, 60, 'Cabelo', 'percentage', 40.00, 1, '2025-12-03 13:27:50', '2025-12-03 13:34:27', NULL),
(120, 'Cronograma Wella 1 seção  (G)', 'já pago', 116.67, 60, 'Cabelo', 'percentage', 40.00, 1, '2025-12-03 13:29:12', '2025-12-03 13:34:03', NULL),
(121, 'Cronograma Wella 2 seção  (G)', 'já pago', 116.67, 60, 'Cabelo', 'percentage', 40.00, 1, '2025-12-03 13:29:43', '2025-12-03 13:34:57', NULL),
(122, 'Cronograma Wella 3 seção  (G)', 'já pago', 116.67, 60, 'Cabelo', 'percentage', 40.00, 1, '2025-12-03 13:30:22', '2025-12-03 13:35:26', NULL),
(123, 'Cronograma Wella 1 seção  (GG)', 'já pago', 133.35, 60, 'Cabelo', 'percentage', 40.00, 1, '2025-12-03 13:31:20', '2025-12-03 13:34:37', NULL),
(124, 'Cronograma Wella 2 seção  (GG)', 'já pago', 133.35, 60, 'Cabelo', 'percentage', 40.00, 1, '2025-12-03 13:32:00', '2025-12-03 13:35:12', NULL),
(125, 'Cronograma Wella 3 seção  (GG)', 'já pago', 133.35, 60, 'Cabelo', 'percentage', 40.00, 1, '2025-12-03 13:32:34', '2025-12-03 13:35:39', NULL),
(126, 'Tratamento Truss 1 Seção (P)', 'paga na hora', 80.00, 60, 'Cabelo', 'percentage', 40.00, 1, '2025-12-03 13:37:47', '2025-12-03 13:37:47', NULL),
(127, 'Tratamento Truss 1 Seção (M)', 'paga na hora', 90.00, 60, 'Cabelo', 'percentage', 40.00, 1, '2025-12-03 13:38:29', '2025-12-03 13:38:29', NULL),
(128, 'Tratamento Truss 1 Seção (G)', 'paga na hora', 100.00, 60, 'Cabelo', 'percentage', 40.00, 1, '2025-12-03 13:39:08', '2025-12-03 13:39:08', NULL),
(129, 'Tratamento Truss 1 Seção (GG)', 'paga na hora', 110.00, 60, 'Cabelo', 'percentage', 40.00, 1, '2025-12-03 13:39:46', '2025-12-03 13:39:46', NULL),
(130, 'Tratamento Truss 1 Seção (Mega)', 'paga na hora', 120.00, 60, 'Cabelo', 'percentage', 40.00, 1, '2025-12-03 13:40:21', '2025-12-03 13:40:21', NULL),
(131, 'Cronograma Grati completo (P)', '5 seções', 250.00, 60, 'Cabelo', 'percentage', 0.00, 1, '2026-01-19 15:26:01', '2026-01-19 15:27:56', NULL),
(132, 'Cronograma Grati completo (M)', '5 seções', 275.00, 60, 'Cabelo', 'percentage', 40.00, 1, '2026-01-19 15:27:07', '2026-01-19 15:30:21', NULL),
(133, 'Cronograma Grati completo (G)', '5 seções', 300.00, 60, 'Cabelo', 'percentage', 40.00, 1, '2026-01-19 15:30:06', '2026-01-19 15:30:06', NULL),
(134, 'Cronograma Grati completo (GG)', '5 seçães', 325.00, 60, 'Cabelo', 'percentage', 40.00, 1, '2026-01-19 15:31:42', '2026-01-19 15:31:42', NULL),
(135, 'Cronograma Grati completo (Mega)', '5 seções', 400.00, 60, 'Cabelo', 'percentage', 40.00, 1, '2026-01-19 15:32:58', '2026-01-19 15:32:58', NULL);

-- --------------------------------------------------------

--
-- Estrutura da tabela `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_activity` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura da tabela `states`
--

CREATE TABLE `states` (
  `id` smallint UNSIGNED NOT NULL,
  `name` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `uf` varchar(2) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Extraindo dados da tabela `states`
--

INSERT INTO `states` (`id`, `name`, `uf`) VALUES
(11, 'Rondônia', 'RO'),
(12, 'Acre', 'AC'),
(13, 'Amazonas', 'AM'),
(14, 'Roraima', 'RR'),
(15, 'Pará', 'PA'),
(16, 'Amapá', 'AP'),
(17, 'Tocantins', 'TO'),
(21, 'Maranhão', 'MA'),
(22, 'Piauí', 'PI'),
(23, 'Ceará', 'CE'),
(24, 'Rio Grande do Norte', 'RN'),
(25, 'Paraíba', 'PB'),
(26, 'Pernambuco', 'PE'),
(27, 'Alagoas', 'AL'),
(28, 'Sergipe', 'SE'),
(29, 'Bahia', 'BA'),
(31, 'Minas Gerais', 'MG'),
(32, 'Espírito Santo', 'ES'),
(33, 'Rio de Janeiro', 'RJ'),
(35, 'São Paulo', 'SP'),
(41, 'Paraná', 'PR'),
(42, 'Santa Catarina', 'SC'),
(43, 'Rio Grande do Sul', 'RS'),
(50, 'Mato Grosso do Sul', 'MS'),
(51, 'Mato Grosso', 'MT'),
(52, 'Goiás', 'GO'),
(53, 'Distrito Federal', 'DF');

-- --------------------------------------------------------

--
-- Estrutura da tabela `suppliers`
--

CREATE TABLE `suppliers` (
  `id` bigint UNSIGNED NOT NULL,
  `name` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `trade_name` varchar(160) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cnpj` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cpf` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(160) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `zip_code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_person` varchar(160) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_terms` text COLLATE utf8mb4_unicode_ci,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura da tabela `users`
--

CREATE TABLE `users` (
  `id` bigint UNSIGNED NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Extraindo dados da tabela `users`
--

INSERT INTO `users` (`id`, `name`, `username`, `email`, `email_verified_at`, `password`, `remember_token`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 'Michele', 'michele', 'michele@yazolabs.com', NULL, '$2y$12$KLQoZh8zI2xpb.jcnk1JduWoFwSc5k0vgQJHGBaxybvwlXPOjySsy', NULL, '2025-11-23 02:18:55', '2025-11-23 02:18:55', NULL),
(2, 'Symon', 'symon', 'symon@yazolabs.com', NULL, '$2y$12$17P0jBZ23ZP25WrkzLL0KOQ.biGy3U.Tu5A8UmYPVwFBl8.0wAnmm', NULL, '2025-11-23 02:18:55', '2025-11-23 02:18:55', NULL),
(3, 'Jammily', 'jammily', 'jammily@yazolabs.com', NULL, '$2y$12$0jNb8FUKERgsHAWQVum9ZuDuZNOHwXLtBg2LQvV5wI9ZNfk9/xWYG', NULL, '2025-11-23 02:18:56', '2025-11-23 02:18:56', NULL),
(4, 'Melissa', 'melissa', 'melissa@yazolabs.com', NULL, '$2y$12$7DKv25poyp/6XcO1Cckl7eAzxWytAKKJu.A.l8KXVHoIh.Z/AXTue', NULL, '2025-11-23 02:18:56', '2025-11-23 02:18:56', NULL),
(5, 'Carla', 'carla', 'carla@yazolabs.com', NULL, '$2y$12$oOfyHVLEfS8TJnZ35yDKuOyC4Zd.PwGjo6hQc5EUZ/apuRE1uTQVm', NULL, '2025-11-23 02:18:56', '2025-11-23 02:18:56', NULL),
(6, 'Maria', 'maria', 'maria@yazolabs.com', NULL, '$2y$12$bZROdqiUqDsRZ6BM7j9fge6FLd/bcmU4xfZqpnnwk/gpC7qvmhRcO', NULL, '2025-11-23 02:18:56', '2025-11-23 02:18:56', NULL),
(7, 'Angela', 'angela', 'angela@yazolabs.com', NULL, '$2y$12$g/asvJVEwWvW.7.Ofm2liesavATWujshjx9SCaEUP1ID9gdOT1N8i', NULL, '2025-11-23 02:18:56', '2025-11-24 16:11:21', NULL),
(8, 'Thay', 'thay', 'thay@yazolabs.com', NULL, '$2y$12$9ytK/kyNVnUJj5Y/bTZVieMd9pjsG5FzL6fQCaKAHY/h.naNzM7p2', NULL, '2025-11-23 02:18:57', '2025-11-23 02:18:57', NULL),
(9, 'Claudia', 'claudia', 'claudia@yazolabs.com', NULL, '$2y$12$a6E9hhpFRfEtZO5BnU5hGehl8G5MjewXIjsIqesO3hyPRHqUi6Rba', NULL, '2025-11-23 02:18:57', '2025-11-23 02:18:57', NULL),
(10, 'Geluce', 'geluce', 'geluce@yazolabs.com', NULL, '$2y$12$wKZvshZWhmbMW0CC/SsShup1iGsVr8vpE3/p23O.e7RUoSdjGi6Gi', NULL, '2025-11-23 02:18:57', '2026-01-22 11:50:54', '2026-01-22 11:50:54'),
(11, 'Yazo Labs', 'yazo', 'yazolabs@gmail.com', NULL, '$2y$12$kFJyEJBiwlQAxP1raPilb.Bv87HjYYQcp.DUeaGgs2WpHISTc.iRO', NULL, '2025-11-26 09:14:04', '2025-11-26 09:14:04', NULL);

--
-- Índices para tabelas despejadas
--

--
-- Índices para tabela `accounts_payable`
--
ALTER TABLE `accounts_payable`
  ADD PRIMARY KEY (`id`),
  ADD KEY `accounts_payable_supplier_id_foreign` (`supplier_id`),
  ADD KEY `accounts_payable_professional_id_foreign` (`professional_id`),
  ADD KEY `accounts_payable_status_due_date_index` (`status`,`due_date`),
  ADD KEY `accounts_payable_appointment_id_professional_id_index` (`appointment_id`,`professional_id`);

--
-- Índices para tabela `actions`
--
ALTER TABLE `actions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `actions_name_unique` (`name`),
  ADD UNIQUE KEY `actions_slug_unique` (`slug`);

--
-- Índices para tabela `appointments`
--
ALTER TABLE `appointments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `appointments_customer_id_foreign` (`customer_id`),
  ADD KEY `appointments_promotion_id_foreign` (`promotion_id`),
  ADD KEY `appointments_date_status_index` (`date`,`status`);

--
-- Índices para tabela `appointment_item`
--
ALTER TABLE `appointment_item`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `appointment_item_appointment_id_item_id_unique` (`appointment_id`,`item_id`),
  ADD KEY `appointment_item_item_id_foreign` (`item_id`);

--
-- Índices para tabela `appointment_payments`
--
ALTER TABLE `appointment_payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `appointment_payments_appointment_id_method_index` (`appointment_id`,`method`);

--
-- Índices para tabela `appointment_service`
--
ALTER TABLE `appointment_service`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `appointment_service_unique` (`appointment_id`,`service_id`,`professional_id`,`starts_at`),
  ADD KEY `appointment_service_prof_time_idx` (`professional_id`,`starts_at`,`ends_at`),
  ADD KEY `appointment_service_service_id_foreign` (`service_id`);

--
-- Índices para tabela `cache`
--
ALTER TABLE `cache`
  ADD PRIMARY KEY (`key`);

--
-- Índices para tabela `cache_locks`
--
ALTER TABLE `cache_locks`
  ADD PRIMARY KEY (`key`);

--
-- Índices para tabela `cashier_transactions`
--
ALTER TABLE `cashier_transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `cashier_transactions_user_id_foreign` (`user_id`),
  ADD KEY `cashier_transactions_date_type_index` (`date`,`type`);

--
-- Índices para tabela `commissions`
--
ALTER TABLE `commissions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `commissions_service_id_foreign` (`service_id`),
  ADD KEY `commissions_customer_id_foreign` (`customer_id`),
  ADD KEY `commissions_professional_id_status_index` (`professional_id`,`status`),
  ADD KEY `commissions_date_index` (`date`),
  ADD KEY `commissions_appointment_id_professional_id_index` (`appointment_id`,`professional_id`);

--
-- Índices para tabela `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `customers_name_index` (`name`),
  ADD KEY `customers_city_index` (`city`),
  ADD KEY `customers_state_index` (`state`),
  ADD KEY `customers_active_index` (`active`);

--
-- Índices para tabela `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`);

--
-- Índices para tabela `items`
--
ALTER TABLE `items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `items_barcode_unique` (`barcode`),
  ADD KEY `items_supplier_id_foreign` (`supplier_id`),
  ADD KEY `items_name_index` (`name`),
  ADD KEY `items_category_index` (`category`);

--
-- Índices para tabela `item_prices`
--
ALTER TABLE `item_prices`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `item_prices_item_id_effective_date_unique` (`item_id`,`effective_date`);

--
-- Índices para tabela `item_price_histories`
--
ALTER TABLE `item_price_histories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `item_price_histories_item_id_foreign` (`item_id`),
  ADD KEY `item_price_histories_changed_by_foreign` (`changed_by`);

--
-- Índices para tabela `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jobs_queue_index` (`queue`);

--
-- Índices para tabela `job_batches`
--
ALTER TABLE `job_batches`
  ADD PRIMARY KEY (`id`);

--
-- Índices para tabela `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Índices para tabela `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`email`);

--
-- Índices para tabela `permissions`
--
ALTER TABLE `permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `permissions_role_id_screen_id_action_id_unique` (`role_id`,`screen_id`,`action_id`),
  ADD KEY `permissions_screen_id_foreign` (`screen_id`),
  ADD KEY `permissions_action_id_foreign` (`action_id`);

--
-- Índices para tabela `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  ADD KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  ADD KEY `personal_access_tokens_expires_at_index` (`expires_at`);

--
-- Índices para tabela `professionals`
--
ALTER TABLE `professionals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `professionals_user_id_foreign` (`user_id`),
  ADD KEY `professionals_active_index` (`active`);

--
-- Índices para tabela `professional_open_windows`
--
ALTER TABLE `professional_open_windows`
  ADD PRIMARY KEY (`id`),
  ADD KEY `pow_prof_start_end_idx` (`professional_id`,`start_date`,`end_date`);

--
-- Índices para tabela `promotions`
--
ALTER TABLE `promotions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `promotions_active_index` (`active`),
  ADD KEY `promotions_start_date_end_date_index` (`start_date`,`end_date`);

--
-- Índices para tabela `promotion_item`
--
ALTER TABLE `promotion_item`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `promotion_item_promotion_id_item_id_unique` (`promotion_id`,`item_id`),
  ADD KEY `promotion_item_item_id_foreign` (`item_id`);

--
-- Índices para tabela `promotion_service`
--
ALTER TABLE `promotion_service`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `promotion_service_promotion_id_service_id_unique` (`promotion_id`,`service_id`),
  ADD KEY `promotion_service_service_id_foreign` (`service_id`);

--
-- Índices para tabela `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `roles_name_unique` (`name`),
  ADD UNIQUE KEY `roles_slug_unique` (`slug`);

--
-- Índices para tabela `role_user`
--
ALTER TABLE `role_user`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `role_user_user_id_role_id_unique` (`user_id`,`role_id`),
  ADD KEY `role_user_role_id_foreign` (`role_id`);

--
-- Índices para tabela `screens`
--
ALTER TABLE `screens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `screens_name_unique` (`name`),
  ADD UNIQUE KEY `screens_slug_unique` (`slug`);

--
-- Índices para tabela `services`
--
ALTER TABLE `services`
  ADD PRIMARY KEY (`id`),
  ADD KEY `services_category_index` (`category`),
  ADD KEY `services_active_index` (`active`);

--
-- Índices para tabela `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_index` (`user_id`),
  ADD KEY `sessions_last_activity_index` (`last_activity`);

--
-- Índices para tabela `states`
--
ALTER TABLE `states`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `states_uf_unique` (`uf`);

--
-- Índices para tabela `suppliers`
--
ALTER TABLE `suppliers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `suppliers_cnpj_unique` (`cnpj`),
  ADD UNIQUE KEY `suppliers_cpf_unique` (`cpf`),
  ADD KEY `suppliers_name_index` (`name`);

--
-- Índices para tabela `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_username_unique` (`username`),
  ADD UNIQUE KEY `users_email_unique` (`email`);

--
-- AUTO_INCREMENT de tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `accounts_payable`
--
ALTER TABLE `accounts_payable`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT de tabela `actions`
--
ALTER TABLE `actions`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de tabela `appointments`
--
ALTER TABLE `appointments`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=65;

--
-- AUTO_INCREMENT de tabela `appointment_item`
--
ALTER TABLE `appointment_item`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `appointment_payments`
--
ALTER TABLE `appointment_payments`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT de tabela `appointment_service`
--
ALTER TABLE `appointment_service`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=96;

--
-- AUTO_INCREMENT de tabela `cashier_transactions`
--
ALTER TABLE `cashier_transactions`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `commissions`
--
ALTER TABLE `commissions`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT de tabela `customers`
--
ALTER TABLE `customers`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=132;

--
-- AUTO_INCREMENT de tabela `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `items`
--
ALTER TABLE `items`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de tabela `item_prices`
--
ALTER TABLE `item_prices`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `item_price_histories`
--
ALTER TABLE `item_price_histories`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT de tabela `permissions`
--
ALTER TABLE `permissions`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=117;

--
-- AUTO_INCREMENT de tabela `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=52;

--
-- AUTO_INCREMENT de tabela `professionals`
--
ALTER TABLE `professionals`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de tabela `professional_open_windows`
--
ALTER TABLE `professional_open_windows`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT de tabela `promotions`
--
ALTER TABLE `promotions`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de tabela `promotion_item`
--
ALTER TABLE `promotion_item`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `promotion_service`
--
ALTER TABLE `promotion_service`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `roles`
--
ALTER TABLE `roles`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de tabela `role_user`
--
ALTER TABLE `role_user`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT de tabela `screens`
--
ALTER TABLE `screens`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT de tabela `services`
--
ALTER TABLE `services`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=136;

--
-- AUTO_INCREMENT de tabela `suppliers`
--
ALTER TABLE `suppliers`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- Restrições para despejos de tabelas
--

--
-- Limitadores para a tabela `accounts_payable`
--
ALTER TABLE `accounts_payable`
  ADD CONSTRAINT `accounts_payable_appointment_id_foreign` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `accounts_payable_professional_id_foreign` FOREIGN KEY (`professional_id`) REFERENCES `professionals` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `accounts_payable_supplier_id_foreign` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL;

--
-- Limitadores para a tabela `appointments`
--
ALTER TABLE `appointments`
  ADD CONSTRAINT `appointments_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `appointments_promotion_id_foreign` FOREIGN KEY (`promotion_id`) REFERENCES `promotions` (`id`) ON DELETE SET NULL;

--
-- Limitadores para a tabela `appointment_item`
--
ALTER TABLE `appointment_item`
  ADD CONSTRAINT `appointment_item_appointment_id_foreign` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `appointment_item_item_id_foreign` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE CASCADE;

--
-- Limitadores para a tabela `appointment_payments`
--
ALTER TABLE `appointment_payments`
  ADD CONSTRAINT `appointment_payments_appointment_id_foreign` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE CASCADE;

--
-- Limitadores para a tabela `appointment_service`
--
ALTER TABLE `appointment_service`
  ADD CONSTRAINT `appointment_service_appointment_id_foreign` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `appointment_service_professional_id_foreign` FOREIGN KEY (`professional_id`) REFERENCES `professionals` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `appointment_service_service_id_foreign` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE CASCADE;

--
-- Limitadores para a tabela `cashier_transactions`
--
ALTER TABLE `cashier_transactions`
  ADD CONSTRAINT `cashier_transactions_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Limitadores para a tabela `commissions`
--
ALTER TABLE `commissions`
  ADD CONSTRAINT `commissions_appointment_id_foreign` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `commissions_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `commissions_professional_id_foreign` FOREIGN KEY (`professional_id`) REFERENCES `professionals` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `commissions_service_id_foreign` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE CASCADE;

--
-- Limitadores para a tabela `items`
--
ALTER TABLE `items`
  ADD CONSTRAINT `items_supplier_id_foreign` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL;

--
-- Limitadores para a tabela `item_prices`
--
ALTER TABLE `item_prices`
  ADD CONSTRAINT `item_prices_item_id_foreign` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE CASCADE;

--
-- Limitadores para a tabela `item_price_histories`
--
ALTER TABLE `item_price_histories`
  ADD CONSTRAINT `item_price_histories_changed_by_foreign` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `item_price_histories_item_id_foreign` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE CASCADE;

--
-- Limitadores para a tabela `permissions`
--
ALTER TABLE `permissions`
  ADD CONSTRAINT `permissions_action_id_foreign` FOREIGN KEY (`action_id`) REFERENCES `actions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `permissions_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `permissions_screen_id_foreign` FOREIGN KEY (`screen_id`) REFERENCES `screens` (`id`) ON DELETE CASCADE;

--
-- Limitadores para a tabela `professionals`
--
ALTER TABLE `professionals`
  ADD CONSTRAINT `professionals_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Limitadores para a tabela `professional_open_windows`
--
ALTER TABLE `professional_open_windows`
  ADD CONSTRAINT `professional_open_windows_professional_id_foreign` FOREIGN KEY (`professional_id`) REFERENCES `professionals` (`id`) ON DELETE CASCADE;

--
-- Limitadores para a tabela `promotion_item`
--
ALTER TABLE `promotion_item`
  ADD CONSTRAINT `promotion_item_item_id_foreign` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `promotion_item_promotion_id_foreign` FOREIGN KEY (`promotion_id`) REFERENCES `promotions` (`id`) ON DELETE CASCADE;

--
-- Limitadores para a tabela `promotion_service`
--
ALTER TABLE `promotion_service`
  ADD CONSTRAINT `promotion_service_promotion_id_foreign` FOREIGN KEY (`promotion_id`) REFERENCES `promotions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `promotion_service_service_id_foreign` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE CASCADE;

--
-- Limitadores para a tabela `role_user`
--
ALTER TABLE `role_user`
  ADD CONSTRAINT `role_user_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `role_user_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
