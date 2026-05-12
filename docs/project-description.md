# Project Description

> **Original title (Bulgarian):** *Система за прогнозиране на цъфтеж на водорасли в крайбрежни води чрез анализ на сензорни данни и машинно обучение*
>
> **English:** *A system for forecasting algal blooms in coastal waters through sensor-data analysis and machine learning.*

## Team

9th-grade students at **Vocational High School of Computer Programming and Innovation, Burgas** (*Професионална гимназия по компютърно програмиране и иновации, Бургас*):

- Denislav Ivanov Dimov
- Altay Hyusein Yemendzhiev
- Vsevolod Yuriyovich Bolotov
- Aleksandar Vladimirov Dyanov
- Georgi Anatoliev Georgiev

## Summary

We propose a web platform for **early warning of algal blooms in Burgas Bay**. The system uses readings from standard water-quality sensors - temperature, nitrates, phosphates, and turbidity - and predicts the probability of a bloom in the next **3 to 5 days**.

Results are shown on a map of three pilot beaches - **Sarafovo**, **Central Beach Burgas**, and **Kraimorie** - using a simple traffic-light color code (🟢 green / 🟡 yellow / 🔴 red).

The platform helps:

- **Citizens and tourists** make an informed choice about which beach to visit.
- **Institutions** get an early-warning tool for prevention and response.

## What It Does

The project is a web platform that uses water-quality data from conventional sensors to forecast the risk of phytoplankton growth in the next 3-5 days. The system analyzes key parameters - temperature, nitrates, phosphates, and turbidity - and estimates the probability that **chlorophyll-a** (the indicator of an algal bloom) will rise.

The pilot covers three beaches near Burgas. For each monitoring point the platform displays a color-coded risk on a map of Burgas Bay. The goal is a simple early-warning tool for both the public and institutions.

## The Real Problem

Algal blooms in coastal waters lead to:

- Degraded water quality
- Foul odor
- Reduced transparency
- Health risks
- Negative impact on tourism

Today there is **no easy-to-use, real-time early-warning system** for these events. Citizens and tourists pick a beach without knowing the current state of the water, and institutions usually react only **after** the problem has occurred.

This project aims to shift the response from **reactive** to **proactive** by forecasting bloom conditions several days in advance.

## How the Idea Works

1. **Sensors** at each monitoring point measure key parameters tied to phytoplankton growth.
2. A **machine-learning model** processes those readings, learns the relationships between them, and predicts the probability of rising algal biomass over the next 3-5 days.
3. The result is shown on a **web map of Burgas Bay**. For each of the three beaches a color indicator appears:
   - 🟢 **Green** - low bloom risk
   - 🟡 **Yellow** - moderate risk
   - 🔴 **Red** - high risk
4. Users can compare beaches at a glance and decide where to go.

## Parameters and Technology

### Measured parameters

The system uses standard water-quality monitoring sensors. Main parameters analyzed:

- Water temperature
- Nitrates (NO₃)
- Phosphates (PO₄)
- Turbidity
- Chlorophyll-a *(used as the bloom indicator and as the model's training target)*

### Tech architecture

- Sensor-data ingestion (simulated or real IoT data)
- Machine-learning model for bloom-risk forecasting
- Backend API to compute and serve predictions
- Web frontend with a map of Burgas Bay and a green / yellow / red color system

The platform is browser-based, so results are easy to interpret for citizens, tourists, and local authorities alike.

## Daily Email Subscriptions

Beyond the live map, visitors can subscribe to receive the daily forecast for a chosen beach directly in their inbox. From `/subscribe` they enter an email, pick one of the three pilot beaches, and choose a delivery hour (local time, autodetected). After a double-opt-in confirmation click, the system sends one short email per day at that hour with the predicted risk class, chlorophyll-a value, forecast window, and current Burgas weather (Open-Meteo).

Subscriptions are stored in **Supabase Postgres** (single `subscriptions` table plus a `sent_log` table that enforces one email per subscription per local day). Transactional emails are sent via **Resend**. A GitHub Actions hourly cron pings an internal `/internal/tick` endpoint (gated by a shared secret) which runs the dispatcher: it picks subscribers whose local hour matches the current tick, builds the forecast, and sends the email.

### `subscriptions` table

| Column              | Type          | Default                   | Notes                                                                |
| ------------------- | ------------- | ------------------------- | -------------------------------------------------------------------- |
| `id`                | `uuid`        | `gen_random_uuid()`       | Primary key                                                          |
| `email`             | `text`        | -                         | Not null, lowercased on insert                                       |
| `location_id`       | `text`        | -                         | One of `sarafovo`, `central_beach_burgas`, `kraimorie`               |
| `hour_local`        | `int2`        | `8`                       | 0-23, delivery hour in the subscriber's local timezone               |
| `timezone`          | `text`        | `'Europe/Sofia'`          | IANA zone, autodetected from the browser                             |
| `confirm_token`     | `text`        | -                         | Unique, nullable; cleared once the user clicks the confirmation link |
| `confirmed_at`      | `timestamptz` | -                         | Null until double opt-in completes                                   |
| `unsubscribe_token` | `text`        | `gen_random_uuid()::text` | Unique, not null; used in the per-email unsubscribe URL              |
| `active`            | `bool`        | `true`                    | Set to false on unsubscribe                                          |
| `created_at`        | `timestamptz` | `now()`                   | Not null                                                             |

Composite `UNIQUE (email, location_id)` allows the same address to subscribe to multiple beaches but not duplicate the same beach. An index on `(active, hour_local)` keeps the hourly dispatch lookup fast.
