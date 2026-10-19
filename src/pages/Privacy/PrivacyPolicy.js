import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './PrivacyPolicy.css';

export default function PrivacyPolicy() {
  useEffect(() => {
    document.title = 'Privacy Policy - Nitroxx';
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <div className="nitroxx-white-policy-layout">
      {/* Centered Document Content (No Sidebars) */}
      <main className="policy-center-content">
        {/* Breadcrumb Header */}
        <div className="policy-breadcrumb">
          <Link to="/" className="breadcrumb-home-link" aria-label="Home">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>Home</span>
          </Link>
          <span className="breadcrumb-separator">&gt;</span>
          <span className="breadcrumb-pill">Privacy Policy</span>
        </div>

        {/* Page Titles */}
        <h1 className="policy-main-title">Privacy Policy</h1>
        <div className="policy-scope-subtitle">Nitroxx India and Global (Events &amp; Marketplace)</div>
        <div className="policy-last-updated">Last updated in August, 2026.</div>

        {/* SECTION 1: Applicability and Scope */}
        <section id="applicability-and-scope">
          <h2 className="policy-heading-2">Applicability and Scope</h2>
          <p className="policy-paragraph">
            This Privacy Policy applies to Services offered under the <strong>Nitroxx</strong> brand by{' '}
            <strong>Nitroxx Technologies Private Limited</strong> in India and its affiliated operational entities
            internationally. In this Privacy Policy, &quot;Nitroxx&quot;, &quot;we&quot;, &quot;us&quot; and &quot;our&quot;
            refer to the relevant entity providing the Services in your location. Nitroxx respects your privacy and is
            committed to protecting it. This Privacy Policy describes:
          </p>
          <ul className="policy-bullet-list">
            <li className="policy-bullet-item">
              the types of information that Nitroxx may collect from or about you when you access or use Nitroxx websites,
              mobile applications, partner interfaces, host dashboards, seller hubs, Nitroxx-operated pages or accounts on
              social-media and other third-party platforms, campaign pages or forms, and other online or offline services
              offered under the Nitroxx brand (collectively, the &quot;Services&quot;); and
            </li>
            <li className="policy-bullet-item">
              our practices for collecting, using, maintaining, protecting and disclosing that information across our unified
              ecosystem — encompassing both <strong>Nitroxx Events &amp; Experiences</strong> and the{' '}
              <strong>Nitroxx Marketplace &amp; Gear</strong>.
            </li>
          </ul>
          <p className="policy-paragraph">
            This Privacy Policy applies to information Nitroxx collects through the Services; through email, text, telephone,
            WhatsApp, and other electronic communications sent through or in connection with the Services; and through
            interactions connected with the Services. Nitroxx Technologies Private Limited owns and operates the Nitroxx
            platform and, together with its group companies and technical partners, supports technology, payment, ticketing,
            marketplace order routing, logistics, and operational functions described in this Privacy Policy.
          </p>
          <p className="policy-paragraph">
            This Privacy Policy does not apply to information that you provide directly to, or that is collected and processed
            independently by, a third party, such as a racetrack authority, private event venue, rally promoter, external
            motocross club, independent riding gear manufacturer, third-party seller store, bank, payment gateway, or
            social-media platform. It does apply to information that such a third party makes available to Nitroxx in
            connection with the Services, including a Nitroxx-operated page, account or campaign. We encourage you to review
            the privacy practices of such third parties before providing information to them.
          </p>
          <p className="policy-paragraph">
            Please read this Privacy Policy carefully to understand Nitroxx&apos;s practices regarding your information. By
            accessing or using the Services or registering for a Nitroxx account, you acknowledge the practices described in
            this Privacy Policy. Where consent is required for any processing, Nitroxx will seek such consent in the manner
            required by applicable law. If you do not provide information that is necessary for a particular Service, Nitroxx
            may be unable to provide that Service to you.
          </p>
          <p className="policy-paragraph">
            This Privacy Policy principally describes Nitroxx&apos;s processing in connection with riders, consumers, event
            attendees, and marketplace shoppers. It also applies, in the manner described in the section &quot;Other
            Categories of Data Processing&quot;, to individuals who interact with Nitroxx as personnel, event hosts, marshals,
            applicants, partners, vendors, contractors, sellers, advisers, business contacts or visitors.
          </p>
        </section>

        {/* SECTION 2: The information we collect and how we use it */}
        <section id="the-information-we-collect">
          <h2 className="policy-heading-2">The information we collect and how we use it</h2>
          <p className="policy-paragraph">
            Nitroxx collects information from and about users of the Services, including:
          </p>
          <p className="policy-paragraph">
            <strong>Personal Information:</strong> Information that relates to an identified or identifiable individual. It
            may include information you provide directly upon account creation, information generated through your event
            registrations, ticket bookings, gear orders, motorcycle garage entries, or information obtained from third
            parties which, alone or together with other information available or likely to be available to us, can identify
            you.
          </p>
          <p className="policy-paragraph">
            <strong>Other Information:</strong> Information connected with your account, device, vehicle preferences,
            activities or use of the Services that may not identify you by itself. This may include information about your
            internet connection, devices, fitment filters, browsing patterns and interactions with the Services.
          </p>
          <p className="policy-paragraph">
            As described below, we collect information directly from you, automatically when you interact with the Services,
            and from third-party sources.
          </p>
        </section>

        {/* SECTION 3: Information You Provide to Us */}
        <section id="information-you-provide-to-us">
          <h2 className="policy-heading-2">Information You Provide to Us</h2>
          <p className="policy-paragraph">The information we collect on or through the Services may include:</p>

          <p className="policy-paragraph">
            <strong>Account and profile information:</strong> Your name, mobile phone number, email address, password,
            one-time-password verification records or other authentication information, address, city, date of birth, gender,
            profile photograph, riding bio, experience level, and other information you choose to add to your account or
            profile. If you use a third-party sign-in service, we may receive the information that service makes available
            based on the permissions you grant.
          </p>

          <p className="policy-paragraph">
            <strong>Motorcycle Garage &amp; Vehicle Fitment (&quot;My Bikes&quot;):</strong> Information regarding the motorcycles
            you own and add to your digital garage, including motorcycle make/brand (e.g., Royal Enfield, KTM, Yamaha,
            Kawasaki, BMW Motorrad, Triumph, Ducati, Honda, etc.), model, manufacturing year, engine displacement (CC),
            modifications, and registration details where required for track scrutiny or event eligibility. This information is
            used to filter guaranteed compatible riding accessories, parts, luggage racks, and event categories.
          </p>

          <p className="policy-paragraph">
            <strong>Event Booking, ride reservation and attendance information:</strong> Information relating to motorcycle
            rallies, track days, group rides, night rides, training clinics, exhibitions, stunt showcases, meetups, tours,
            and activities that you search for, save, book, attend, cancel, review or express interest in. This may include the
            host or venue, ride date and time, ticket tier, batch or slot selection, vehicle scrutiny declarations, party size,
            booking or ticket identifier, add-ons (rental transponders, commemorative merchandise, meal tokens), ride safety
            waiver confirmations, emergency contact name and phone number (mandatory for track events and rallies), entry status,
            and cancellation or refund information. For an expedition, tour, or cross-country ride, this may also include your
            itinerary, hotel or pick-up/flag-off location and related instructions.
          </p>

          <p className="policy-paragraph">
            <strong>Event ticketing and access credentials:</strong> Information required to issue, deliver, collect, transfer,
            validate or support a physical or digital ticket pass, including contact details, delivery or pick-up information,
            attendee names provided by you, booking confirmations, cryptographic QR codes or similar ticket credentials, and
            records relating to gate entry, rescheduling, cancellation and refunds. Where required for ticket collection, track
            entry, age-restricted events, driving license verification, or refund processing, we or the relevant Host may also
            request information from a government-issued identity document, driving license, or related supporting material.
          </p>

          <p className="policy-paragraph">
            <strong>Marketplace, riding gear and order information:</strong> Details of products you search for, save, add to
            cart, or purchase through the Nitroxx Marketplace, including riding jackets, helmets, gloves, boots, protective
            armor, bike performance parts, luggage systems, exhausts, and combos. This includes sizing and fit specifications
            (helmet head circumference, jacket chest size, boot Euro size), vehicle fitment selections, delivery contact
            person, complete shipping address, dispatch records, courier tracking numbers, delivery confirmations, returns,
            replacements, and warranty records.
          </p>

          <p className="policy-paragraph">
            <strong>Store, gift-card and offer information:</strong> Partner stores, brand hubs, and deals you view, save or
            use; details of in-store payments; offers or discounts you lock or redeem; gift cards or vouchers you purchase or
            use through the Services; and related transaction, reference, redemption, refund and support records.
          </p>

          <p className="policy-paragraph">
            <strong>Group and collaborative feature information:</strong> Information you provide when sharing a ride booking,
            splitting an order bill, inviting another rider, participating in a group ride plan, or creating or contributing
            to a collaborative ThrottleList, Hotlist, or wishlist. This may include the names and contact details of other
            participants, their participation or payment status, messages, votes, selections and content contributed to a
            shared feature. If you provide information about another person, you confirm that you are authorised to provide it
            for the relevant purpose.
          </p>

          <p className="policy-paragraph">
            <strong>Your content and preferences:</strong> Ratings, reviews, photographs, videos, audio, comments, likes,
            bookmarks, ThrottleLists, saved events, garage preferences, feedback, messages, and other information or content
            you upload, publish, transmit or otherwise provide through the Services. Information that you choose to publish or
            share with other riders may be visible to those users or to the public, depending on the feature and your settings.
          </p>

          <p className="policy-paragraph">
            <strong>Social-media and campaign information:</strong> Information you provide when you interact with a
            Nitroxx-operated page, account or campaign, including your username or handle, profile details, comments,
            reactions, tags, mentions, messages, survey responses, campaign or contest entries, and information needed to
            confirm eligibility, contact participants or deliver a prize, benefit or service.
          </p>

          <p className="policy-paragraph">
            <strong>Your activities:</strong> Search terms, results selected, listings viewed, items saved, offers redeemed,
            content interactions, advertisements clicked, session lengths, and feature usage.
          </p>

          <p className="policy-paragraph">
            <strong>Your communications:</strong> Communications with Nitroxx, our customer-support or operational teams, event
            hosts, marketplace sellers, or other riders through or in connection with the Services; information provided in
            complaints, disputes and refund requests; responses to surveys, polls, contests, promotions, or beta tests. We may
            retain and, where permitted, record communications for support, quality, training, fraud-prevention, safety and
            dispute-resolution purposes.
          </p>

          <p className="policy-paragraph">
            <strong>Transactional and payment information:</strong> Information required to process ticket bookings, gear
            orders, payments, refunds, rewards, Nitroxx Wallet balances, subscriptions and other transactions, including your
            contact details, billing address, order value, payment method, payment status, bank or issuer offers used, masked
            card details (last 4 digits), payment tokens, transaction references and related risk signals. Payment-card and
            sensitive payment credentials are collected directly by PCI-compliant payment processors and not stored by Nitroxx
            in their complete form.
          </p>

          <p className="policy-paragraph">
            <strong>Image and video information:</strong> Photographs or videos you upload or capture through a feature (such as
            event photos, gear unboxings, or bike garage pictures), and images or video recordings collected at events organized
            or managed by Nitroxx or at Nitroxx premises for documentation, safety, security or promotional purposes.
          </p>

          <p className="policy-paragraph">
            <strong>Contact and third-party information:</strong> If you choose to use a feature that requires you to provide
            another person&apos;s contact information (such as emergency contacts for rides or splitting a checkout bill), we
            process the names, phone numbers or other details you choose to provide for that feature.
          </p>
        </section>

        {/* SECTION 4: Data of Minors */}
        <section id="data-of-minors">
          <h2 className="policy-heading-2">Data of Minors</h2>
          <p className="policy-paragraph">
            Our Services are generally not directed to or intended for use by individuals under the age of 18
            (&quot;Minors&quot;), and we do not knowingly collect personal information from Minors for the purposes of creating
            an account or for general use of our platform. In particular, operating motor vehicles, participating in track days
            or highway group rides, and purchasing adult safety gear is restricted to adult riders aged 18 and older.
          </p>
          <p className="policy-paragraph">
            However, we recognize that certain spectator services offered through our platform may be open to Minors (for
            example, purchasing a spectator pass for a family-friendly bike show or exhibition on Nitroxx). While our platform
            is not designed for Minors, an adult user may need to provide limited information about a Minor to access such
            services. By providing personal information of a Minor, you, the adult user, represent and warrant that:
          </p>
          <ul className="policy-bullet-list">
            <li className="policy-bullet-item">You are the parent or legal guardian of the Minor; and</li>
            <li className="policy-bullet-item">
              You give your explicit consent for Nitroxx to collect and process the Minor&apos;s information for the specific
              and limited purpose disclosed at the time of collection.
            </li>
          </ul>
          <p className="policy-paragraph">
            The information collected will be used solely to facilitate the requested service and will not be used to create a
            user profile for the Minor or for any marketing, profiling, or other secondary purposes. You are responsible for any
            information you provide about a Minor. If we become aware that personal information of a Minor has been provided
            without the requisite and valid parental or guardian consent, we reserve the right to delete such information
            immediately.
          </p>
        </section>

        {/* SECTION 5: Information We Collect Through Automatic Data Collection Technologies */}
        <section id="information-we-collect-through-automatic-data-collection-technologies">
          <h2 className="policy-heading-2">
            Information We Collect Through Automatic Data Collection Technologies
          </h2>
          <p className="policy-paragraph">
            We may automatically collect information about the computers or devices, including mobile devices, that you use to
            access the Services and about your use of the Services, including when you use the Services without registering or
            logging in.
          </p>
          <p className="policy-paragraph">
            <strong>Service usage and activity data:</strong> Details about your interactions with the Services, including
            search queries, pages and listings viewed, gear filters applied, features used, clicks, scrolls, session duration,
            timestamps, referral URLs, transaction-history summaries, and online or offline application status.
          </p>
          <p className="policy-paragraph">
            <strong>Device and connection information:</strong> IP address, device type, operating system, browser type and
            version, application version, device settings such as language and time zone, connection type, mobile-network
            information, and unique device or advertising identifiers.
          </p>
          <p className="policy-paragraph">
            <strong>Location information:</strong> Your selected city, approximate location inferred from information such as
            your IP address, and, where you grant permission, precise or real-time device location. We use location information
            to show nearby rides, flag-off points, local workshops, gear retailers, and tracks; display route maps; determine
            location-specific shipping timelines and offers; prevent fraud; and provide other location-enabled features.
          </p>
          <p className="policy-paragraph">
            <strong>Device permissions and feature data:</strong> Depending on the feature and permissions you grant, the
            Services may access your camera, photographs, media, notifications, contacts or similar device functions. For
            example, camera access may be used to scan an event ticket QR code or payment QR code, and photo access may be used
            to upload review media or bike garage pictures. We process only the information made available through the permission
            and relevant feature.
          </p>
          <p className="policy-paragraph">
            <strong>Payment application and hand-off information:</strong> Where required to initiate or complete a payment, UPI
            or similar hand-off, we may detect whether a compatible application or payment method is available on your device
            and receive information concerning the success or failure of the hand-off.
          </p>
          <p className="policy-paragraph">
            <strong>Diagnostics:</strong> Crash records, error logs, performance data, debugging information, network diagnostics
            and other technical information used to maintain and improve the reliability and security of the Services.
          </p>
          <p className="policy-paragraph">
            <strong>Cookies and other electronic tools:</strong> We and third parties with whom we work may use cookies, SDKs,
            pixel tags, web beacons, mobile-device identifiers and similar technologies to collect and store information about
            your use of the Services. We use these technologies to remember preferences, maintain sessions, preserve your
            active shopping cart and wishlist, conduct analytics, measure feature popularity, prevent fraud, and deliver or
            measure relevant content.
          </p>
          <p className="policy-paragraph">
            <strong>Cookie controls:</strong> You may be able to manage cookies through your browser or device settings.
            Disabling cookies may affect the availability or operation of some Services.
          </p>
        </section>

        {/* SECTION 6: Information from Third Parties */}
        <section id="information-from-third-parties">
          <h2 className="policy-heading-2">Information from Third Parties</h2>
          <p className="policy-paragraph">We may obtain information about you from third-party sources, including:</p>
          <p className="policy-paragraph">
            <strong>Third-party account authentication:</strong> If you choose to log in, link or connect your Nitroxx account
            with a third-party service (such as Google or Apple), you authorise us to receive information that you permit that
            service to share, such as your user identifier, name, email address, and profile picture.
          </p>
          <p className="policy-paragraph">
            <strong>Partners:</strong> Event hosts, ride organizers, racetrack operators, marshals, touring agencies,
            marketplace sellers, gear manufacturers, and authorized distributors may provide booking, fulfillment, attendance,
            gate check-in, tracking, dispatch, return inspection, warranty verification, dispute, or transaction information
            relating to you.
          </p>
          <p className="policy-paragraph">
            <strong>Payment and offer partners:</strong> Payment gateways, banks, card networks, wallet or UPI providers, and
            fraud-prevention providers may provide transaction status, payment references, eligibility, cashback, reward,
            dispute, chargeback or risk information.
          </p>
          <p className="policy-paragraph">
            <strong>Other users:</strong> Another rider may provide information about you when adding you to an event pass,
            sharing a ride itinerary, inviting you to a ThrottleList, splitting a bill, or contacting support about a transaction
            involving you.
          </p>
          <p className="policy-paragraph">
            <strong>Combining information:</strong> We may combine information received from third parties with information
            collected directly from you or automatically through your use of the Services to maintain accurate records, detect
            fraud, understand usage patterns, and personalize your experience.
          </p>
        </section>

        {/* SECTION 7: How we use the information we collect */}
        <section id="how-we-use-the-information-we-collect">
          <h2 className="policy-heading-2">How we use the information we collect</h2>
          <p className="policy-paragraph">
            We primarily collect and use information to provide the Services that you choose to use. The Services are supported
            by operational, technical and commercial functions that directly or indirectly enable or improve the platform. We
            use information collected from and about you for purposes including:
          </p>
          <ul className="policy-bullet-list">
            <li className="policy-bullet-item">
              <strong>Account administration:</strong> To register and authenticate you, maintain your account and rider profile,
              remember your bike garage settings and preferences, and communicate account, policy and service information.
            </li>
            <li className="policy-bullet-item">
              <strong>Discovery, fitment and personalisation:</strong> To identify your city or location; show motorcycle
              events, track days, group rides, riding gear, and bike parts relevant to your motorcycle model; rank content;
              maintain ThrottleLists and wishlists; and personalize recommendations.
            </li>
            <li className="policy-bullet-item">
              <strong>Event bookings and pass fulfilment:</strong> To check ticket availability; create, confirm, modify, cancel
              and support event registrations; allocate batches or track slots; send confirmations and reminders; enable digital
              ticket QR issuance, transfer, and gate check-in; communicate emergency contact details to marshals; and administer
              waivers and refunds.
            </li>
            <li className="policy-bullet-item">
              <strong>Marketplace orders and deliveries:</strong> To process gear and accessory orders, verify fitment
              compatibility with your bike garage, route orders to sellers, coordinate courier shipping, send real-time tracking
              updates, manage returns and exchanges, and support warranty claims.
            </li>
            <li className="policy-bullet-item">
              <strong>Group and social features:</strong> To share ride bookings, invite participants, enable collaborative
              ThrottleLists, allocate or collect bill shares, and deliver interactive community features selected by you.
            </li>
            <li className="policy-bullet-item">
              <strong>Payments and financial administration:</strong> To process and reconcile payments, booking fees, convenience
              fees, wallet credits, settlements, refunds, and bank offers; prevent duplicate or fraudulent transactions; and
              maintain financial and audit records.
            </li>
            <li className="policy-bullet-item">
              <strong>Customer support and communications:</strong> To answer questions, resolve complaints, investigate
              disputes, provide support, communicate with hosts and sellers, collect feedback, and send transactional and
              administrative messages.
            </li>
            <li className="policy-bullet-item">
              <strong>Platform maintenance, safety and compliance:</strong> To diagnose technical issues, maintain platform
              stability, secure accounts, detect and prevent fraud, ticket scalping, counterfeit gear, and unauthorized resale;
              enforce our Terms of Service; protect riders, hosts, sellers and the public; and comply with legal obligations.
            </li>
            <li className="policy-bullet-item">
              <strong>Service improvement and analytics:</strong> To analyze user behavior, vehicle trends, feature usage and
              transaction patterns; test, develop and improve platform features; conduct user research; and train support
              personnel.
            </li>
            <li className="policy-bullet-item">
              <strong>Marketing and promotions:</strong> To send communications through email, SMS, WhatsApp, or push
              notifications concerning Nitroxx events, gear launches, offers or promotions, subject to the choices and
              permissions available to you and applicable law.
            </li>
          </ul>
        </section>

        {/* SECTION 8: How we share the information we collect */}
        <section id="how-we-share-the-information-we-collect">
          <h2 className="policy-heading-2">How we share the information we collect</h2>
          <p className="policy-paragraph">
            To facilitate and support the Services, we may disclose information collected from or about you in the following
            ways:
          </p>
          <p className="policy-paragraph">
            <strong>Affiliates:</strong> To Nitroxx Technologies group companies and subsidiaries for shared infrastructure,
            identity and authentication, payments, fraud prevention, safety, customer support, analytics, technology, and legal
            compliance.
          </p>
          <p className="policy-paragraph">
            <strong>Partners (Hosts &amp; Sellers):</strong> To the event hosts, track venues, ride organizers, marshals,
            marketplace sellers, and gear brands involved in a booking, order, or experience, as described in the section
            &quot;Information Shared with Partners&quot;.
          </p>
          <p className="policy-paragraph">
            <strong>Other users selected by you:</strong> To people with whom you choose to share an event booking, ticket pass,
            order bill, ThrottleList or other content. Information visible to them will depend on the feature and your selections.
          </p>
          <p className="policy-paragraph">
            <strong>Service providers:</strong> To contractors, vendors and service providers that perform services for us,
            including hosting, cloud storage, communications, ticketing technology, courier delivery, identity verification,
            payment processing, fraud detection, analytics, advertising, customer support, and technical services. Such providers
            are authorized to use the information solely for the services they provide to us.
          </p>
          <p className="policy-paragraph">
            <strong>Payment and banking participants:</strong> To payment gateways, banks, card networks, and wallet/UPI
            providers to initiate, authenticate, process, reconcile, refund, or audit a transaction.
          </p>
          <p className="policy-paragraph">
            <strong>Legal purposes:</strong> To law-enforcement bodies, traffic authorities, government agencies, courts, and
            regulators when we believe in good faith that disclosure is required by law, reasonably necessary to respond to legal
            process, investigate severe road safety incidents, protect rights and safety, or defend legal claims.
          </p>
          <p className="policy-paragraph">
            <strong>Corporate transactions:</strong> In connection with a merger, investment, restructuring, sale or transfer
            of all or part of Nitroxx or its assets, subject to appropriate confidentiality and legal requirements.
          </p>
        </section>

        {/* SECTION 9: Information Shared with Partners */}
        <section id="information-shared-with-partners">
          <h2 className="policy-heading-2">Information Shared with Partners</h2>
          <p className="policy-paragraph">
            When you initiate or participate in an event booking, ride pass reservation, gear purchase, or payment through the
            Services, we share information with the relevant event organizer, track operator, touring host, or marketplace seller
            (collectively, &quot;Partners&quot;) to enable transaction fulfillment.
          </p>
          <p className="policy-paragraph">
            <strong>For Events:</strong> The information shared with the event host may include your name, phone number, email
            address, booking reference, cryptographic QR ticket credential, ride date/time, ticket category, vehicle model (for
            track scrutiny), attendee names, emergency contact name and phone number, waiver confirmation, and refund details.
          </p>
          <p className="policy-paragraph">
            <strong>For Marketplace Orders:</strong> The information shared with sellers and courier partners includes your name,
            delivery address, contact phone number, ordered item SKU and size specifications, and return notes to enable packaging,
            doorstep transit, delivery confirmation, and warranty servicing.
          </p>
          <p className="policy-paragraph">
            A Partner may independently process information it receives for fulfillment, gate admission, safety management,
            customer service, and legal compliance in accordance with applicable law and its own privacy practices. Nitroxx does
            not control a Partner&apos;s independent subsequent processing. We encourage you to review the relevant Partner&apos;s
            privacy notices.
          </p>
        </section>

        {/* SECTION 10: Data Storage */}
        <section id="data-storage">
          <h2 className="policy-heading-2">Data Storage</h2>
          <p className="policy-paragraph">
            Nitroxx processes and retains personal information on secure cloud infrastructure located in India, and on systems
            operated by trusted service providers adhering to robust data protection standards.
          </p>
          <p className="policy-paragraph">
            We retain information for as long as reasonably necessary for the purposes for which it was collected or otherwise
            processed, including to provide the Services, maintain transactional and financial records, resolve disputes, prevent
            fraud and abuse, enforce agreements, protect legal rights, and comply with statutory tax, GST, accounting, and
            regulatory requirements (such as retaining financial and invoicing records for statutory retention periods of 7-8
            years).
          </p>
        </section>

        {/* SECTION 11: Your Information */}
        <section id="your-information">
          <h2 className="policy-heading-2">Your Information</h2>
          <p className="policy-paragraph">
            <strong>Correspondence:</strong> You can manage certain notification preferences through your account settings or by
            using the unsubscribe link in promotional communications. You may continue to receive transactional, security, policy
            and legal communications necessary to operate your account and fulfill active bookings or orders.
          </p>
          <p className="policy-paragraph">
            <strong>Review and correction:</strong> You may review and update your profile information, saved addresses, and bike
            garage details directly through your Nitroxx Profile. You may also contact us to request correction of inaccurate
            personal data.
          </p>
          <p className="policy-paragraph">
            <strong>Permissions and consent:</strong> You can manage device permissions (such as location, camera, or
            notifications) through your device settings. Where processing is based on your consent, you may withdraw that consent
            at any time.
          </p>
          <p className="policy-paragraph">
            <strong>Account Deletion:</strong> You may request deletion of your Nitroxx account using the option available in your
            Profile settings or by contacting our Data Protection Officer at{' '}
            <a href="mailto:privacy@nitroxx.in" style={{ color: '#6d28d9', textDecoration: 'underline' }}>
              privacy@nitroxx.in
            </a>
            . Once an account and its associated personal data have been deleted, they may not be capable of restoration.
            Account deletion does not cancel active event passes or pending marketplace orders, and does not require deletion of
            records that Nitroxx is legally permitted or required to retain for statutory compliance.
          </p>
        </section>

        {/* SECTION 12: Additional Provisions for Regional Users */}
        <section id="additional-provisions-regional">
          <h2 className="policy-heading-2">Additional Provisions for Regional Users</h2>
          <p className="policy-paragraph">
            If you access or use our Services internationally or in regions with specific data protection laws (such as the UAE
            or the European Economic Area), we ensure appropriate contractual and security safeguards when transferring personal
            information across borders.
          </p>
          <p className="policy-paragraph">
            Subject to applicable local regulations, you may have the right to request access to your data, request data
            portability, restrict certain processing activities, or lodge a complaint with your regional data supervisory
            authority. You can submit such requests by contacting our privacy team.
          </p>
        </section>

        {/* SECTION 13: Other Categories of Data Processing */}
        <section id="other-categories-of-data-processing">
          <h2 className="policy-heading-2">Other Categories of Data Processing</h2>
          <p className="policy-paragraph">
            In addition to consumer and rider processing, Nitroxx may process personal information about individuals who interact
            with us in other capacities:
          </p>
          <p className="policy-paragraph">
            <strong>Job applicants:</strong> Contact details, resumes, qualifications, interview records, and background
            verification information used for recruitment purposes.
          </p>
          <p className="policy-paragraph">
            <strong>Event hosts, marshals, and merchant personnel:</strong> Business contact details, identification or
            verification credentials, tax details (PAN/GST), bank account information, contracts, and platform activity records
            used to onboard partners, manage listings, administer bookings, make financial settlements, and maintain compliance.
          </p>
          <p className="policy-paragraph">
            <strong>Vendors and business contacts:</strong> Names, business credentials, invoices, and payment records used to
            procure services, manage contracts, and maintain business operations.
          </p>
          <p className="policy-paragraph">
            <strong>Event and premises visitors:</strong> Registration, access, attendance, CCTV, and vehicle information
            collected for security, safety, and event documentation.
          </p>
        </section>

        {/* SECTION 14: Security: How we protect your information */}
        <section id="security-how-we-protect-your-information">
          <h2 className="policy-heading-2">Security: How we protect your information</h2>
          <p className="policy-paragraph">
            We have implemented physical, electronic, technical and managerial measures intended to safeguard personal
            information, prevent unauthorised access and maintain data security. These measures include TLS encryption for data in
            transit, database encryption at rest, secure firewalls, and least-privilege employee access controls.
          </p>
          <p className="policy-paragraph">
            Third-party service providers that provide payment-gateway and payment-processing services maintain strict PCI-DSS
            compliance.
          </p>
          <p className="policy-paragraph">
            No method of transmission or electronic storage is completely secure, and we cannot guarantee absolute security. You
            play an important role in protecting your information and should not share your password, one-time password (OTP),
            ticket QR credentials, account access, or payment credentials with anyone.
          </p>
        </section>

        {/* SECTION 15: Miscellaneous */}
        <section id="miscellaneous">
          <h2 className="policy-heading-2">Miscellaneous</h2>
          <p className="policy-paragraph">
            <strong>Third-party links and services:</strong> The Services may contain links to or integrations with third-party
            websites, applications or services (such as motorcycle manufacturer sites, external route mappers, or social
            platforms). Nitroxx is not responsible for the privacy practices or content of such third parties.
          </p>
          <p className="policy-paragraph">
            <strong>Policy amendments:</strong> We may amend this Privacy Policy from time to time to reflect changes in law, our
            data practices, the features of the Services or technology. Please check this page periodically for changes. We will
            post an updated version and revise the &quot;Last updated&quot; date at the top of this document. Where required by
            law, we will provide additional notice or seek consent for material changes.
          </p>
        </section>

        {/* SECTION 16: Contact Us */}
        <section id="contact-us">
          <h2 className="policy-heading-2">Contact Us</h2>
          <p className="policy-paragraph">
            If you have questions or concerns relating to the processing or use of your information, wish to make a request
            described in this Privacy Policy, or have a grievance, you may contact the designated{' '}
            <strong>Data Protection &amp; Grievance Officer</strong>:
          </p>
          <div
            style={{
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '24px',
              marginTop: '16px',
            }}
          >
            <p style={{ margin: '0 0 8px 0', fontSize: '15px', color: '#111827' }}>
              <strong>Nitroxx Technologies Private Limited</strong>
            </p>
            <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#4b5563' }}>
              Attention: Data Protection &amp; Grievance Officer
            </p>
            <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#4b5563' }}>
              Email:{' '}
              <a
                href="mailto:privacy@nitroxx.in"
                style={{ color: '#6d28d9', fontWeight: 600, textDecoration: 'none' }}
              >
                privacy@nitroxx.in
              </a>{' '}
              / Official Support:{' '}
              <a
                href="mailto:support@nitroxx.in"
                style={{ color: '#6d28d9', fontWeight: 600, textDecoration: 'none' }}
              >
                support@nitroxx.in
              </a>
            </p>
            <p style={{ margin: 0, fontSize: '13.5px', color: '#6b7280' }}>
              Grievance redressal response timeline: Acknowledgment within 48 hours; resolution within 30 days as prescribed by
              applicable regulations.
            </p>
          </div>
        </section>

        {/* Clean bottom navigation / footer */}
        <footer
          style={{
            marginTop: '60px',
            paddingTop: '24px',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            fontSize: '13.5px',
            color: '#6b7280',
          }}
        >
          <div>© 2026 Nitroxx Technologies Private Limited. All rights reserved.</div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <Link to="/" style={{ color: '#4b5563', textDecoration: 'none' }}>
              Home
            </Link>
            <Link to="/events" style={{ color: '#4b5563', textDecoration: 'none' }}>
              Events
            </Link>
            <Link to="/shop" style={{ color: '#4b5563', textDecoration: 'none' }}>
              Marketplace
            </Link>
            <Link to="/terms" style={{ color: '#4b5563', textDecoration: 'none' }}>
              Terms of Service
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
