# Product Requirements Document (PRD)
## TAG — The Admissions Group
### Festival Ticketing & 360° Experience Platform

**Version:** 1.0  
**Date:** January 2024  
**Authors:** Ila Nicholson & Shane Mitchell, Proprietors  
**Incorporated:** Ireland  

---

## 1. Executive Summary

TAG (The Admissions Group) is a full-stack festival ticketing and ancillary services platform. Unlike incumbent ticketing companies that operate as pure-play transaction processors, TAG is positioned as a **360-degree festival solutions company** — covering ticketing, travel, accommodation, dining, merchandise, social engagement, and vendor management under a single platform.

The platform will launch in Europe (Ireland incorporation) and expand into high-growth emerging markets, with India as the primary target in Year 3.

---

## 2. Problem Statement

### 2.1 Industry Pain Points

| Stakeholder | Problems |
|-------------|----------|
| **Companies / Operators** | Monopolistic structures with little incentive to innovate; poor customer service reputation; no real-time visibility data |
| **Vendors** | No collaborative communication with festival production; not integrated into festival ecosystems; unable to budget dynamically |
| **Users / Fans** | High, unexplained fees; unreliable service; limited choice of ancillary amenities; no control over experience |

### 2.2 Market Opportunity

- Global event tickets market valued at **$60 billion**, growing at **30.3% in 2023**
- CAGR of **7.1% (2017–2027)**, resilient despite COVID disruption
- Festival-specific sub-sector is **underserved** — only one homegrown US competitor with minimal international traction in 10 years
- Continents like **Asia and Africa** have only a handful of ticketing companies
- **Favourable antitrust policies** in the US and Europe creating space for new entrants
- Low market valuations post-COVID present M&A and organic growth opportunities

---

## 3. Goals & Objectives

| Goal | Detail |
|------|--------|
| Launch a festival-focused ticketing platform | Initially targeting North America and Europe |
| Differentiate via 360° service model | Beyond tickets: travel, lodging, dining, merchandise, social |
| Expand internationally | India by Year 3; additional emerging markets thereafter |
| Achieve platform monetisation | Subscription (B2C & B2B), booking fees, partnership fees, marketing fees |
| Raise pre-seed capital of €500K | To fund proof-of-concept and tech infrastructure |
| Long-term funding target | €500K–€5M over Years 1–3 |
| Exit strategy | Stay private 7–10 years, then IPO or strategic acquisition |

---

## 4. Target Users

### 4.1 B2C — Festival Goers
- Adults aged 20–64 with disposable income
- Domestic and international travellers attending music, cultural, and light festivals
- Users seeking convenience: single-app for ticket + travel + stay + dining

### 4.2 B2B — Festival Clients & Suppliers
- Festival producers and promoters
- Local vendors (restaurants, car rentals, accommodation, local attractions)
- Musicians, artists, and their management
- Local governments and tourism boards

---

## 5. Product Overview

### 5.1 Core Concept: Festival Application Platform (App)

A mobile-first, omnichannel platform covering the complete festival experience lifecycle — before, during, and after the event.

```
Festival Ticket + Meal Advance Bookings + Local Tourist Attractions
+ Community Engagement + Social Features + Merchandise
+ Interactions with Fanbases + Rebates in Cities + Hotels & Car Rentals
```

### 5.2 Key Differentiators vs. Competitors

| Dimension | Incumbents | TAG |
|-----------|-----------|-----|
| CX Journey | Old-style webpages; fragmented | Simple, intuitive unified interface |
| Mobile App | Present but limited | Feature-rich app on serverless cloud |
| Seating | Basic | Good visibility |
| Community | Blogs only | Blog + content sharing + ratings/reviews + fans area |
| Tech Architecture | CMS / monolithic | Microservices/API on serverless cloud |
| Data & AI | Not evident | Heavy AI usage for CX improvement and upsell identification |
| Scope | Ticketing only | Full 360° service ecosystem |

---

## 6. Competitive Landscape

### 6.1 Primary Market Competitors
Companies that sell tickets directly between ticketing company, clients/promoters, and event goers.

| Company | Notes |
|---------|-------|
| **TicketMaster** | Market leader; CMS platform, no microservices/API; limited mobile app; no AI |
| **See Tickets** | Seamless webpage; microservices/API; limited community features |
| **Ace Tickets** | Primary market operator |

### 6.2 Secondary Market Competitors
Companies that interact directly with event attendees in the resale market.

| Company | Notes |
|---------|-------|
| **StubHub** | Major resale marketplace |
| **SeatGeek** | Strong mobile app; microservices/API; limited community |
| **Viagogo** | Global resale platform |

### 6.3 Festival Application Model Competitors (Direct)

| Company | Founded | HQ | Overview |
|---------|---------|-----|---------|
| **Festicket** (est.) | 2012 | London, UK | Online marketplace for music festival packages (tickets + transport + accommodation); 46M website visits, 3M customers (2019) |
| **TicketLeap** (est.) | 2003 | Philadelphia, PA | Lightweight self-serve ticketing; 30M+ tickets sold; social media integration; no comprehensive app features |
| **Townscript / BookMyShow** (est.) | 2014 | Pune, India | Indian self-serve platform; large festival focus but ticketing-only; BookMyShow commands 85% of Indian online cinema ticketing |

### 6.4 Full Platform Competitive Analysis (Slide 36 Comparison)

| Platform | CX Journey | Mobile App | Seating Visibility | Community | Tech Arch | AI/Data |
|----------|-----------|-----------|-------------------|-----------|-----------|---------|
| TicketMaster | Poor (old-style) | Limited | Basic | Very limited | CMS/monolithic | No |
| See Tickets | Seamless | Limited | Basic | Blogs only | Microservices/API | Not evident |
| Eventbrite | Improved, not optimal | Good | None | Blogs only | Microservices/API | Not evident |
| Tixr | Good | Basic | Basic | Blogs only | Microservices/API | Basic |
| Etix | Good | Not found | Basic | Very limited | Not available | Not evident |
| TicketLeap | Simple/effective | Basic | Good | Very limited | Microservices/API | Not evident |
| TicketIQ | Old-style | Poor | Good | None | Microservices/API | No |
| SeatGeek | Seamless | Very good | Good | Limited | Microservices/API | No |
| Townscript | Seamless | Basic | Good | Blogs only | Microservices/API | Basic |
| **TAG** | **Simple, intuitive** | **Feature-rich (serverless)** | **Good** | **Blog + sharing + ratings + fans** | **Serverless microservices/API** | **Heavy AI** |

---

## 7. Features & Requirements

### 7.1 Consumer Subscription Tiers

| Feature | Free | Basic | Premium |
|---------|------|-------|---------|
| Ticket Booking | ✓ | ✓ | ✓ |
| Social Features | ✓ | ✓ | ✓ |
| Meal Bookings | — | ✓ | ✓ |
| Redeemable Rewards Points | — | Standard | Double / Triple |
| Local Guide | — | Limited | ✓ |
| Ad-free Experience | — | — | ✓ |
| Reserve Seating | — | — | ✓ |
| Refundable Tickets | — | — | ✓ |
| Access to Member Exclusive Events | — | — | ✓ |
| Eligibility for Giveaways | — | — | ✓ |

### 7.2 Vendor/Organiser Subscription Tiers

| Service | Free | Premium |
|---------|------|---------|
| Customer Booking | ✓ | ✓ |
| Access to Customer Information | — | ✓ |
| Data Analytics | — | ✓ |
| Marketing Services | — | ✓ |
| Personalized Page | — | ✓ |

### 7.3 Festival Services Offered

- Festival Planning & Development Services
- Festival Merchandising Services
- Festival Doctor (on-site medical/support)
- Festival Financial Consultancy Services
- Programming Services
- Sponsorship & Branding Services
- Marketing Services
- Festival Production Services
- Social Features & Fan Engagement
- Vendor Partnerships

---

## 8. Revenue Model

### 8.1 Revenue Streams

| Stream | Share |
|--------|-------|
| Partnership fees | 45% |
| Ticket booking fees | 21% |
| Marketing fees | 17% |
| Others | 17% |

### 8.2 Partnership Fee Breakdown

| Partner Category | Share |
|-----------------|-------|
| Local Business | 29% |
| Accommodation | 19% |
| Restaurant | 19% |
| Musician/Client | 18% |
| Car Rental | 9% |
| Local Government | 6% |

### 8.3 Payment Processing

| Type | Share |
|------|-------|
| Payment processing fees | 78% |
| Venue fees | 22% |

---

## 9. Platform Architecture Requirements

| Requirement | Detail |
|-------------|--------|
| UI/UX | Simple, intuitive interface with low latency |
| Integration | Non-intrusive integrated features (travel, stay, dining) |
| Channels | Omnichannel: web, chat, mobile app |
| Security | End-to-end secured payments and user data |
| AI/ML | Predictive engine for customer needs, cross-sell and upsell |
| Social | Community engagement, content sharing, fan areas |
| Scalability | Serverless, pay-as-you-scale cloud architecture |
| Architecture | Microservices/API built on serverless cloud technologies |

---

## 10. Geographic Strategy

### Phase 1 — Year 1 & 2: Europe & North America
| Region | Key Festivals |
|--------|--------------|
| Belgium | Tomorrowland — 600K attendance |
| Spain | Primavera Sound — 500K attendance |
| Netherlands | Amsterdam Dance Event — 450K attendance |
| Hungary | Sziget — 450K attendance |
| Poland | Pol and Rock — 400K attendance |
| UK | Glastonbury — 210K attendance |
| California | Coachella — 645K attendance |
| Texas | Austin City Limits — 420K attendance |
| Illinois | Lollapalooza — 400K attendance |
| Nevada | Electric Daisy Carnival — 400K attendance |
| Florida | Ultra Music Festival — 165K attendance |

### Phase 2 — Year 3: India Expansion
- Large untapped market for festival ticketing
- BookMyShow dominates cinema; festivals underserved
- Build Customer Support Centers in India
- Expand ancillary services to local market

---

## 11. Investment & Roadmap

### 11.1 Funding Targets

| Raise | Purpose |
|-------|---------|
| Pre-seed: €500K | Proof-of-concept; tech infrastructure; founding team |
| Seed: Up to €5M (Years 1–3) | Marketing, business development, platform expansion |
| Initial Valuation | ~€5M |

### 11.2 Use of Funds (€500K Raise)
- Platform development (proof-of-concept)
- Tech infrastructure setup
- Core founding team recruitment

### 11.3 Use of Funds (€5M Raise)
- Mobile app technologists
- Marketing specialists
- Business development team
- Festival relationship management
- India expansion infrastructure

### 11.4 Year-by-Year Roadmap

| Year | Phase | Key Milestones |
|------|-------|---------------|
| **Year 1** | Research & Foundation | Research industry; develop platform model; build founding team; focus on North America & Europe |
| **Year 2** | Build & Proof of Concept | Build platform; proof of concept; establish strategic relationships with festivals |
| **Year 3** | Monetisation & Expansion | Create additional features; begin monetisation; expand India operations; build Customer Support Centers |
| **Year 4** | Scale | Scale festival ticketing internationally; begin monetising through booking & ticket fees |

---

## 12. Exit Strategy

| Path | Detail |
|------|--------|
| **Primary** | Stay private 7–10 years, then IPO (direct listing or standard IPO) |
| **Strategic Acquisition** | AEG, Amazon, or other tech giants |
| **Private Equity** | Insight Partners, Vector Capital |
| **Travel/Booking Companies** | Explorer, Trivago, Booking.com |
| **Merger** | Merger with complementary ticketing/travel company |

---

## 13. Success Metrics

| Metric | Target |
|--------|--------|
| Festivals onboarded (Year 1) | TBD — establish relationships with major European & US festivals |
| Platform users (Year 2) | Proof of concept live; initial paying user base |
| Revenue positive | Year 3+ with booking fees and partnership fees |
| India market penetration | Year 3 |
| Exit valuation | IPO or acquisition target post Year 7 |

---

## 14. Assumptions & Risks

| Risk | Mitigation |
|------|-----------|
| Incumbent dominance (TicketMaster, etc.) | Focus on festival niche; antitrust environment is favourable |
| Platform adoption | Large advertising initiative; rebate incentives for repeat engagement |
| International expansion complexity | Staged rollout; Ireland incorporation for EU access |
| Secondary market abuse | 360° model requires transparency; reduces ticket scalping incentive |
| Pandemic disruption | Platform designed to be pandemic-compliant |
| Funding risk | Conservative pre-seed target (€500K) to reach proof-of-concept before larger raise |

---

*Document prepared from TAG Corporate Presentation v45 — January 2024*
