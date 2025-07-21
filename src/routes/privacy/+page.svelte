<script>
  import { onMount } from "svelte";

  // State for collapsible sections
  let expandedSections = {};


  // Define all sections for the Privacy Policy
  const sections = [
    { id: "introduction", title: "1. Introduction" },
    { id: "collection", title: "2. Collection of Personal Information" },
    { id: "categories", title: "3. Categories of Personal Information" },
    { id: "sensitive", title: "4. Sensitive Personal Information" },
    { id: "purposes", title: "5. Purposes of Processing" },
    { id: "disclosure", title: "6. Disclosure to Third Parties" },
    { id: "transfer", title: "7. International Transfer" },
    { id: "security", title: "8. Data Security" },
    { id: "accuracy", title: "9. Data Accuracy" },
    { id: "minimisation", title: "10. Data Minimisation" },
    { id: "retention", title: "11. Data Retention" },
    { id: "rights", title: "12. Your Legal Rights" },
    { id: "cookies", title: "13. Internet Use, Cookies and Technologies" },
    { id: "accessing", title: "14. Accessing and Correcting Information" },
    { id: "marketing", title: "15. Direct Marketing" },
    { id: "contact", title: "16. Contact Details" },
  ];

  // Initialize all sections as collapsed
  onMount(() => {
    sections.forEach((section) => {
      expandedSections[section.id] = false;
    });
    // Default first section to be expanded
    expandedSections["introduction"] = true;
  });

  // Toggle section expansion
  function toggleSection(id) {
    expandedSections[id] = !expandedSections[id];
  }

  // Function to scroll to section when navigating
  function scrollToSection(id) {
    const element = document.getElementById(id);
    if (element) {
      expandedSections[id] = true;
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
</script>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
  <div class="container mx-auto px-4 py-8">
    <div class="flex flex-col md:flex-row gap-8">
      <!-- Sidebar Navigation -->
      <aside
        class="md:w-1/4 lg:w-1/5 pt-4 sticky top-20 self-start hidden md:block h-screen overflow-y-auto pb-20"
      >
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <h2
            class="text-lg font-bold text-primary-600 dark:text-primary-400 mb-4"
          >
            Table of Contents
          </h2>
          <nav class="space-y-1">
            {#each sections as section}
              <button
                on:click={() => scrollToSection(section.id)}
                class="w-full text-left py-2 px-3 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-primary-500 transition-colors"
              >
                {section.title}
              </button>
            {/each}
          </nav>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="md:w-3/4 lg:w-4/5">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 md:p-8">
          <!-- Header -->
          <div class="border-b border-gray-200 dark:border-gray-700 pb-6 mb-6">
            <div class="flex justify-center mb-6">
              <!-- Logo placeholder (replace with actual logo) -->
              <div
                class="w-64 h-16 rounded-md bg-primary-500 flex items-center justify-center text-white font-bold text-xl"
              >
                BrightBroom
              </div>
            </div>
            <h1
              class="text-3xl font-bold text-center text-gray-900 dark:text-white mb-4"
            >
              PRIVACY POLICY
            </h1>
            <p class="text-center text-gray-600 dark:text-gray-400">
              Effective: November 9, 2021
            </p>
          </div>

          <!-- Mobile Table of Contents -->
          <div class="mb-8 md:hidden">
            <details class="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
              <summary class="font-medium cursor-pointer"
                >Table of Contents</summary
              >
              <nav class="mt-3 ml-4 space-y-1">
                {#each sections as section}
                  <button
                    on:click={() => scrollToSection(section.id)}
                    class="block w-full text-left py-1 text-sm hover:text-primary-500"
                  >
                    {section.title}
                  </button>
                {/each}
              </nav>
            </details>
          </div>

          <!-- Privacy Policy Content -->
          <div class="space-y-6 privacy-content">
            <!-- 1. Introduction -->
            <section id="introduction" class="scroll-mt-20">
              <div
                class="cursor-pointer select-none bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 p-3 md:p-4 rounded-lg flex justify-between items-center"
                on:click={() => toggleSection("introduction")}
              >
                <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                  1. INTRODUCTION
                </h2>
                <svg
                  class={`w-5 h-5 transition-transform ${expandedSections["introduction"] ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </div>

              {#if expandedSections["introduction"]}
                <div
                  class="mt-4 pl-4 pr-2 text-gray-700 dark:text-gray-300 space-y-4"
                >
                  <p>
                    1.1 BrightBroom (Pty) Ltd ("BB, we, us, our") is sensitive
                    to the personal nature of the information you provide to us.
                  </p>

                  <p>
                    1.2 This privacy policy ("this Policy") explains how we
                    protect and use your Personal Information.
                  </p>

                  <p>
                    1.3 By providing us with your Personal Information, you –
                  </p>
                  <div class="pl-6">
                    <p>
                      1.3.1 Agree to this Policy and authorise us to process
                      such information as set out herein; and
                    </p>
                    <p>
                      1.3.2 Authorise us, our Service Providers and other third
                      parties to Process your Personal Information for the
                      purposes stated in this Policy.
                    </p>
                  </div>

                  <p>
                    1.4 We will not use your Personal Information for any other
                    purpose than that set out in this Policy and will endeavour
                    to protect your Personal Information that is in our
                    possession from unauthorised alteration, loss, disclosure or
                    access.
                  </p>

                  <p>
                    1.5 Please note that we may review and update this Policy
                    from time to time. The latest version of this Policy is
                    available on request, alternatively may be downloaded from
                    our Website.
                  </p>

                  <p>
                    1.6 This Policy applies to all external parties with whom we
                    interact, including but not limited to individual clients /
                    tenants, representatives of client organisations, visitors
                    to our offices, and other users of our services ("you").
                    Defined terms used in this Policy are explained in Annexure
                    A.
                  </p>
                </div>
              {/if}
            </section>

            <!-- 2. Collection of Personal Information -->
            <section id="collection" class="scroll-mt-20">
              <div
                class="cursor-pointer select-none bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 p-3 md:p-4 rounded-lg flex justify-between items-center"
                on:click={() => toggleSection("collection")}
              >
                <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                  2. COLLECTION OF PERSONAL INFORMATION
                </h2>
                <svg
                  class={`w-5 h-5 transition-transform ${expandedSections["collection"] ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </div>

              {#if expandedSections["collection"]}
                <div
                  class="mt-4 pl-4 pr-2 text-gray-700 dark:text-gray-300 space-y-4"
                >
                  <p>
                    2.1 We may collect or obtain Personal Information about you
                    –
                  </p>
                  <div class="pl-6">
                    <p>2.1.1 Directly from you;</p>
                    <p>2.1.2 In the course of our relationship with you;</p>
                    <p>2.1.3 When you make your personal information public;</p>
                    <p>
                      2.1.4 When you visit and/or interact with our website, or
                      our various social media platforms;
                    </p>
                    <p>
                      2.1.5 When you register to receive newsletters and updates
                      from us and / or our Service Providers;
                    </p>
                    <p>
                      2.1.6 When you interact with any third-party content or
                      advertising on our website; or
                    </p>
                    <p>2.1.7 When you visit our offices.</p>
                  </div>

                  <p>
                    2.2 In addition to the above, we may create Personal
                    Information about you such as records of your communications
                    and interactions with us, including, but not limited to,
                    your attendance at shareholders meetings, rallies, events,
                    or at interviews in the course of applying for a job with
                    us, subscription to our newsletters and other mailings and
                    interactions with you during the course of our digital
                    marketing campaigns etc.
                  </p>
                </div>
              {/if}
            </section>

            <!-- 3. Categories of Personal Information -->
            <section id="categories" class="scroll-mt-20">
              <div
                class="cursor-pointer select-none bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 p-3 md:p-4 rounded-lg flex justify-between items-center"
                on:click={() => toggleSection("categories")}
              >
                <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                  3. CATEGORIES OF PERSONAL INFORMATION
                </h2>
                <svg
                  class={`w-5 h-5 transition-transform ${expandedSections["categories"] ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </div>

              {#if expandedSections["categories"]}
                <div
                  class="mt-4 pl-4 pr-2 text-gray-700 dark:text-gray-300 space-y-4"
                >
                  <p>
                    We may process the following categories of Personal
                    Information about you –
                  </p>

                  <div class="overflow-x-auto">
                    <table
                      class="min-w-full divide-y divide-gray-200 dark:divide-gray-700"
                    >
                      <thead class="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th
                            scope="col"
                            class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                            >Item</th
                          >
                          <th
                            scope="col"
                            class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                            >Categories</th
                          >
                          <th
                            scope="col"
                            class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                            >Information</th
                          >
                        </tr>
                      </thead>
                      <tbody
                        class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700"
                      >
                        <tr>
                          <td class="px-4 py-3 text-sm">3.1</td>
                          <td class="px-4 py-3 text-sm">Personal details</td>
                          <td class="px-4 py-3 text-sm">Name and surname</td>
                        </tr>
                        <tr>
                          <td class="px-4 py-3 text-sm">3.2</td>
                          <td class="px-4 py-3 text-sm"
                            >Demographic information</td
                          >
                          <td class="px-4 py-3 text-sm"
                            >Gender; date of birth / age; nationality;
                            salutation; title; and language preferences</td
                          >
                        </tr>
                        <tr>
                          <td class="px-4 py-3 text-sm">3.3</td>
                          <td class="px-4 py-3 text-sm"
                            >Identifier information</td
                          >
                          <td class="px-4 py-3 text-sm"
                            >Passport or national identity number, biometric
                            information</td
                          >
                        </tr>
                        <tr>
                          <td class="px-4 py-3 text-sm">3.4</td>
                          <td class="px-4 py-3 text-sm">Contact details</td>
                          <td class="px-4 py-3 text-sm"
                            >Correspondence, residential and / or employment
                            address; telephone number; email address; and
                            details of your public social media profile(s)</td
                          >
                        </tr>
                        <tr>
                          <td class="px-4 py-3 text-sm">3.5</td>
                          <td class="px-4 py-3 text-sm">Attendance records</td>
                          <td class="px-4 py-3 text-sm"
                            >Details of meetings and other events organised by
                            us, or on our behalf which you have attended.</td
                          >
                        </tr>
                        <tr>
                          <td class="px-4 py-3 text-sm">3.6</td>
                          <td class="px-4 py-3 text-sm">Consent records</td>
                          <td class="px-4 py-3 text-sm"
                            >Records of any consents you may have given,
                            together with the date and time, means of consent
                            and any related information.</td
                          >
                        </tr>
                        <tr>
                          <td class="px-4 py-3 text-sm">3.7</td>
                          <td class="px-4 py-3 text-sm">Payment details</td>
                          <td class="px-4 py-3 text-sm"
                            >Billing address; payment method; bank account
                            number or credit card number; invoice records;
                            payment records; SWIFT details; IBAN details;
                            payment amount; payment date; and records of
                            cheques.</td
                          >
                        </tr>
                        <tr>
                          <td class="px-4 py-3 text-sm">3.8</td>
                          <td class="px-4 py-3 text-sm"
                            >Data relating to your visits to our Website</td
                          >
                          <td class="px-4 py-3 text-sm"
                            >Your device type; operating system; browser type;
                            browser settings; IP address; language settings;
                            dates and times of connecting to a Website; and
                            other technical communications information.</td
                          >
                        </tr>
                        <tr>
                          <td class="px-4 py-3 text-sm">3.9</td>
                          <td class="px-4 py-3 text-sm">Employee details</td>
                          <td class="px-4 py-3 text-sm"
                            >Where you interact with us in your capacity as an
                            employee of an organisation, the name, address,
                            telephone number and email address of your employer,
                            to the extent relevant.</td
                          >
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              {/if}
            </section>

            <!-- 4. Sensitive Personal Information -->
            <section id="sensitive" class="scroll-mt-20">
              <div
                class="cursor-pointer select-none bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 p-3 md:p-4 rounded-lg flex justify-between items-center"
                on:click={() => toggleSection("sensitive")}
              >
                <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                  4. SENSITIVE PERSONAL INFORMATION
                </h2>
                <svg
                  class={`w-5 h-5 transition-transform ${expandedSections["sensitive"] ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </div>

              {#if expandedSections["sensitive"]}
                <div
                  class="mt-4 pl-4 pr-2 text-gray-700 dark:text-gray-300 space-y-4"
                >
                  <p>
                    4.1 Where we need to Process your Sensitive Personal
                    Information, we will do so in the ordinary course of our
                    business, for a legitimate purpose, and in accordance with
                    applicable law.
                  </p>
                </div>
              {/if}
            </section>

            <!-- 5. Purposes of Processing -->
            <section id="purposes" class="scroll-mt-20">
              <div
                class="cursor-pointer select-none bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 p-3 md:p-4 rounded-lg flex justify-between items-center"
                on:click={() => toggleSection("purposes")}
              >
                <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                  5. PURPOSES OF PROCESSING AND BASES FOR PROCESSING
                </h2>
                <svg
                  class={`w-5 h-5 transition-transform ${expandedSections["purposes"] ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </div>

              {#if expandedSections["purposes"]}
                <div
                  class="mt-4 pl-4 pr-2 text-gray-700 dark:text-gray-300 space-y-4"
                >
                  <p>
                    5.1 We will Process your Personal Information in the
                    ordinary course of the business of the cleaning and
                    maintenance of commercial and residential space of tenants.
                    We will primarily use your Personal Information only for the
                    purpose for which it was originally or primarily collected.
                    We will use your Personal Information for a secondary
                    purpose only if such purpose constitutes a legitimate
                    interest and is closely related to the original or primary
                    purpose for which the Personal Information was collected. We
                    may subject your Personal Information to Processing during
                    the course of various activities, including, without
                    limitation, the following -
                  </p>
                  <div class="pl-6">
                    <p>5.1.1 Operating and conducting our business;</p>
                    <p>
                      5.1.2 Analysis, evaluation, review and collation of
                      information in order to determine potential issues and /
                      or disputes, prepare memoranda, correspondence, reports,
                      other documents and records (whether in electronic or any
                      other medium whatsoever);
                    </p>
                    <p>
                      5.1.3 Compliance with applicable law and fraud prevention;
                    </p>
                    <p>
                      5.1.4 Transfer of information to our service providers and
                      other third parties; and
                    </p>
                    <p>5.1.5 Recruitment.</p>
                  </div>

                  <p>
                    5.2 We may process your Personal Information for
                    relationship management and marketing purposes in relation
                    to our services (including, but not limited to, Processing
                    that is necessary for the development and improvement of our
                    products and services, for accounts management, and for
                    marketing activities in order to establish, maintain and/or
                    improve our relationship with you and with our Service
                    Providers. We may also analyse your Personal Information for
                    statistical purposes.
                  </p>

                  <p>
                    5.3 We may process your Personal Information for internal
                    management and management reporting purposes, including but
                    not limited to conducting internal audits, conducting
                    internal investigations, implementing internal business
                    controls, providing central processing facilities, for
                    insurance purposes and for management reporting analysis.
                  </p>

                  <p>
                    5.4 We may Process your Personal Information for safety and
                    security purposes.
                  </p>
                </div>
              {/if}
            </section>

            <!-- 6. Disclosure to Third Parties -->
            <section id="disclosure" class="scroll-mt-20">
              <div
                class="cursor-pointer select-none bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 p-3 md:p-4 rounded-lg flex justify-between items-center"
                on:click={() => toggleSection("disclosure")}
              >
                <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                  6. DISCLOSURE OF PERSONAL INFORMATION TO THIRD PARTIES
                </h2>
                <svg
                  class={`w-5 h-5 transition-transform ${expandedSections["disclosure"] ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </div>

              {#if expandedSections["disclosure"]}
                <div
                  class="mt-4 pl-4 pr-2 text-gray-700 dark:text-gray-300 space-y-4"
                >
                  <p>
                    6.1 We may disclose your Personal Information to our
                    Associates and Service Providers, for legitimate business
                    purposes, in accordance with applicable law and subject to
                    applicable professional and regulatory requirements
                    regarding confidentiality. In addition, we may disclose your
                    Personal Information -
                  </p>
                  <div class="pl-6">
                    <p>6.1.1 If required by law;</p>
                    <p>
                      6.1.2 Legal and regulatory authorities, upon request, or
                      for the purposes of reporting any actual or suspected
                      breach of applicable law or regulation;
                    </p>
                    <p>
                      6.1.3 Third party operators (including, but not limited
                      to, data processors such as providers of data hosting
                      services and document review technology and services),
                      located anywhere in the world, subject to Clause 6.2;
                    </p>
                    <p>
                      6.1.4 To any relevant party for the purposes of the
                      prevention, investigation, detection or prosecution of
                      criminal offences or the execution of criminal penalties,
                      including, but not limited to, safeguarding against, and
                      the prevention of threats to, public security;
                    </p>
                    <p>
                      6.1.5 To any relevant third-party acquirer(s), in the
                      event that we sell or transfer all or any portion of our
                      business or assets (including, but not limited to, in the
                      event of a reorganisation, dissolution or liquidation);
                      and
                    </p>
                  </div>

                  <p>
                    6.2 To any relevant third-party provider, where our website
                    uses third party advertising, plugins or content. If we
                    engage a third-party operator to process any of your
                    personal information, we recognise that any Operator who is
                    in a foreign country must be subject to a law, binding
                    corporate rules or binding agreements which provide an
                    adequate level of protection similar to POPIA. We will
                    review our relationships with Operators we engage and, to
                    the extent required by any applicable law in force, we will
                    require such operators to be bound by contractual
                    obligations to -
                  </p>
                  <div class="pl-6">
                    <p>
                      6.2.1 Only process such personal information in accordance
                      with our prior written instructions; and
                    </p>
                    <p>
                      6.2.2 Use appropriate measures to protect the
                      confidentiality and security of such personal information.
                    </p>
                  </div>
                </div>
              {/if}
            </section>

            <!-- 7. International Transfer -->
            <section id="transfer" class="scroll-mt-20">
              <div
                class="cursor-pointer select-none bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 p-3 md:p-4 rounded-lg flex justify-between items-center"
                on:click={() => toggleSection("transfer")}
              >
                <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                  7. INTERNATIONAL TRANSFER OF PERSONAL INFORMATION
                </h2>
                <svg
                  class={`w-5 h-5 transition-transform ${expandedSections["transfer"] ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </div>

              {#if expandedSections["transfer"]}
                <div
                  class="mt-4 pl-4 pr-2 text-gray-700 dark:text-gray-300 space-y-4"
                >
                  <p>
                    7.1 We may transfer your Personal Information to recipients
                    outside of the Republic of South Africa.
                  </p>

                  <p>
                    7.2 Subject to Clause 6.2 above, Personal Information may be
                    transferred outside of the Republic of South Africa provided
                    that the country to which the data is transferred has
                    adopted a law that provides for an adequate level of
                    protection substantially similar to POPIA, the
                    Operator/third party undertakes to protect the Personal
                    Information in line with applicable data protection
                    legislation and the transfer is necessary in order to
                    provide the products and services that are required by our
                    clients.
                  </p>
                </div>
              {/if}
            </section>

            <!-- 8. Data Security -->
            <section id="security" class="scroll-mt-20">
              <div
                class="cursor-pointer select-none bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 p-3 md:p-4 rounded-lg flex justify-between items-center"
                on:click={() => toggleSection("security")}
              >
                <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                  8. DATA SECURITY
                </h2>
                <svg
                  class={`w-5 h-5 transition-transform ${expandedSections["security"] ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </div>

              {#if expandedSections["security"]}
                <div
                  class="mt-4 pl-4 pr-2 text-gray-700 dark:text-gray-300 space-y-4"
                >
                  <p>
                    8.1 We implement appropriate technical and organisational
                    security measures to protect your Personal Information that
                    is in our possession against accidental or unlawful
                    destruction, loss, alteration, unauthorised disclosure,
                    unauthorised access, in accordance with applicable law.
                  </p>

                  <p>
                    8.2 Where there are reasonable grounds to believe that your
                    Personal Information that is in our possession has been
                    accessed or acquired by any unauthorised person, we will
                    notify the relevant regulator and you, unless a public body
                    responsible for detection, prevention or investigation of
                    offences or the relevant regulator informs us that notifying
                    you will impede a criminal investigation.
                  </p>

                  <p>
                    8.3 Because the internet is an open system, the transmission
                    of information via the internet is not completely secure.
                    Although we will implement all reasonable measures to
                    protect your Personal Information that is in our possession,
                    we cannot guarantee the security of any information
                    transmitted using the internet and we cannot be held liable
                    for any loss of privacy occurring during the course of such
                    transmission.
                  </p>
                </div>
              {/if}
            </section>

            <!-- 9. Data Accuracy -->
            <section id="accuracy" class="scroll-mt-20">
              <div
                class="cursor-pointer select-none bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 p-3 md:p-4 rounded-lg flex justify-between items-center"
                on:click={() => toggleSection("accuracy")}
              >
                <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                  9. DATA ACCURACY
                </h2>
                <svg
                  class={`w-5 h-5 transition-transform ${expandedSections["accuracy"] ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </div>

              {#if expandedSections["accuracy"]}
                <div
                  class="mt-4 pl-4 pr-2 text-gray-700 dark:text-gray-300 space-y-4"
                >
                  <p>
                    9.1 The Personal Information provided to us should be
                    accurate, complete and up-to-date. Should Personal
                    Information change, the onus is on the provider of such data
                    to notify us of the change and provide us with the accurate
                    data.
                  </p>
                </div>
              {/if}
            </section>

            <!-- 10. Data Minimisation -->
            <section id="minimisation" class="scroll-mt-20">
              <div
                class="cursor-pointer select-none bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 p-3 md:p-4 rounded-lg flex justify-between items-center"
                on:click={() => toggleSection("minimisation")}
              >
                <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                  10. DATA MINIMISATION
                </h2>
                <svg
                  class={`w-5 h-5 transition-transform ${expandedSections["minimisation"] ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </div>

              {#if expandedSections["minimisation"]}
                <div
                  class="mt-4 pl-4 pr-2 text-gray-700 dark:text-gray-300 space-y-4"
                >
                  <p>
                    10.1 We will restrict its processing of Personal Information
                    to data which is sufficient for the fulfilment of the
                    primary purpose and applicable legitimate purpose for which
                    it was collected.
                  </p>
                </div>
              {/if}
            </section>

            <!-- 11. Data Retention -->
            <section id="retention" class="scroll-mt-20">
              <div
                class="cursor-pointer select-none bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 p-3 md:p-4 rounded-lg flex justify-between items-center"
                on:click={() => toggleSection("retention")}
              >
                <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                  11. DATA RETENTION
                </h2>
                <svg
                  class={`w-5 h-5 transition-transform ${expandedSections["retention"] ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </div>

              {#if expandedSections["retention"]}
                <div
                  class="mt-4 pl-4 pr-2 text-gray-700 dark:text-gray-300 space-y-4"
                >
                  <p>
                    11.1 We will only retain and store Personal Information for
                    the period for which the data is required to serve its
                    primary purpose or a legitimate interest or for the period
                    required to comply with an applicable legal requirement,
                    whichever is longer.
                  </p>
                </div>
              {/if}
            </section>

            <!-- 12. Your Legal Rights -->
            <section id="rights" class="scroll-mt-20">
              <div
                class="cursor-pointer select-none bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 p-3 md:p-4 rounded-lg flex justify-between items-center"
                on:click={() => toggleSection("rights")}
              >
                <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                  12. YOUR LEGAL RIGHTS
                </h2>
                <svg
                  class={`w-5 h-5 transition-transform ${expandedSections["rights"] ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </div>

              {#if expandedSections["rights"]}
                <div
                  class="mt-4 pl-4 pr-2 text-gray-700 dark:text-gray-300 space-y-4"
                >
                  <p>
                    12.1 You may have rights under the South African and other
                    laws to have access to your Personal Information and to ask
                    us to rectify, erase and restrict use of your Personal
                    Information.
                  </p>

                  <p>
                    12.2 You may also have rights to object to your Personal
                    Information being used, to ask for the transfer of Personal
                    Information you have made available to us and to withdraw
                    consent to the use of your Personal Information.
                  </p>
                </div>
              {/if}
            </section>

            <!-- 13. Internet Use, Cookies and Technologies -->
            <section id="cookies" class="scroll-mt-20">
              <div
                class="cursor-pointer select-none bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 p-3 md:p-4 rounded-lg flex justify-between items-center"
                on:click={() => toggleSection("cookies")}
              >
                <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                  13. INTERNET USE, COOKIES AND SIMILAR TECHNOLOGIES
                </h2>
                <svg
                  class={`w-5 h-5 transition-transform ${expandedSections["cookies"] ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </div>

              {#if expandedSections["cookies"]}
                <div
                  class="mt-4 pl-4 pr-2 text-gray-700 dark:text-gray-300 space-y-4"
                >
                  <p>
                    13.1 We may Process your Personal Information by our use of
                    Cookies and similar technologies.
                  </p>

                  <p>
                    13.2 When you visit our Website, we may place Cookies onto
                    your device, or read Cookies already on your device, subject
                    always to obtaining your consent, where required, in
                    accordance with applicable law. We use Cookies to record
                    information about your device, your browser and, in some
                    cases, your preferences and browsing habits.
                  </p>

                  <p>
                    13.3 If you post your personal information on the website's
                    message board/ chat room, you acknowledge and agree that the
                    information you post is publicly available.
                  </p>

                  <p>
                    13.4 If you follow a link on our website to another site,
                    the owner of that site will have its own privacy policy
                    relating to your personal information. We suggest you review
                    that site's privacy policy before you provide personal
                    information
                  </p>
                </div>
              {/if}
            </section>

            <!-- 14. Accessing and Correcting Your Personal Information -->
            <section id="accessing" class="scroll-mt-20">
              <div
                class="cursor-pointer select-none bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 p-3 md:p-4 rounded-lg flex justify-between items-center"
                on:click={() => toggleSection("accessing")}
              >
                <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                  14. ACCESSING AND CORRECTING YOUR PERSONAL INFORMATION
                </h2>
                <svg
                  class={`w-5 h-5 transition-transform ${expandedSections["accessing"] ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </div>

              {#if expandedSections["accessing"]}
                <div
                  class="mt-4 pl-4 pr-2 text-gray-700 dark:text-gray-300 space-y-4"
                >
                  <p>
                    14.1 Subject to certain grounds for refusal set out in the
                    Act, you have the right to access your readily retrievable
                    personal information that we hold and to request a
                    correction to your personal information. Before you exercise
                    this right, we will need evidence to confirm that you are
                    the individual to whom the personal information relates.
                  </p>

                  <p>
                    14.2 In respect of a request for correction, if we think the
                    correction is reasonable and we are reasonably able to
                    change the personal information, we will make the
                    correction. If we do not make the correction, we will take
                    reasonable steps to note on the personal information that
                    you requested the correction.
                  </p>

                  <p>
                    14.3 We may charge you our reasonable costs of providing to
                    you copies of your personal information or correcting that
                    information.
                  </p>
                </div>
              {/if}
            </section>

            <!-- 15. Direct Marketing -->
            <section id="marketing" class="scroll-mt-20">
              <div
                class="cursor-pointer select-none bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 p-3 md:p-4 rounded-lg flex justify-between items-center"
                on:click={() => toggleSection("marketing")}
              >
                <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                  15. DIRECT MARKETING
                </h2>
                <svg
                  class={`w-5 h-5 transition-transform ${expandedSections["marketing"] ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </div>

              {#if expandedSections["marketing"]}
                <div
                  class="mt-4 pl-4 pr-2 text-gray-700 dark:text-gray-300 space-y-4"
                >
                  <p>
                    15.1 We may Process your Personal Information for the
                    purposes of providing you with information regarding
                    products which may be of interest to you. You may
                    unsubscribe for free at any time.
                  </p>

                  <p>
                    15.2 If you currently receive marketing information from us
                    which you would prefer not to receive in the future, please
                    email us at: <a
                      href="mailto:info@brightbroom.co.za"
                      class="text-primary-600 dark:text-primary-400 hover:underline"
                      >info@brightbroom.co.za</a
                    >
                  </p>
                </div>
              {/if}
            </section>

            <!-- 16. Contact Details -->
            <section id="contact" class="scroll-mt-20">
              <div
                class="cursor-pointer select-none bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 p-3 md:p-4 rounded-lg flex justify-between items-center"
                on:click={() => toggleSection("contact")}
              >
                <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                  16. CONTACT DETAILS
                </h2>
                <svg
                  class={`w-5 h-5 transition-transform ${expandedSections["contact"] ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </div>

              {#if expandedSections["contact"]}
                <div
                  class="mt-4 pl-4 pr-2 text-gray-700 dark:text-gray-300 space-y-4"
                >
                  <div class="overflow-x-auto">
                    <table
                      class="min-w-full divide-y divide-gray-200 dark:divide-gray-700"
                    >
                      <tbody
                        class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700"
                      >
                        <tr>
                          <td class="px-4 py-3 text-sm font-medium"
                            >You may contact us at</td
                          >
                          <td class="px-4 py-3 text-sm">BrightBroom(Pty) Ltd</td
                          >
                        </tr>
                        <tr>
                          <td class="px-4 py-3 text-sm font-medium"
                            >Attention</td
                          >
                          <td class="px-4 py-3 text-sm"
                            >Information Officer:<br />Thando Somacele</td
                          >
                        </tr>
                        <tr>
                          <td class="px-4 py-3 text-sm font-medium">Address</td>
                          <td class="px-4 py-3 text-sm"
                            >0B Cedar Avenue West<br />Fourways<br />Randburg<br
                            />2191</td
                          >
                        </tr>
                        <tr>
                          <td class="px-4 py-3 text-sm font-medium"
                            >Telephone</td
                          >
                          <td class="px-4 py-3 text-sm">069 391 5277</td>
                        </tr>
                        <tr>
                          <td class="px-4 py-3 text-sm font-medium">Email</td>
                          <td class="px-4 py-3 text-sm"
                            ><a
                              href="mailto:info@brightbroom.co.za"
                              class="text-primary-600 dark:text-primary-400 hover:underline"
                              >info@brightbroom.co.za</a
                            ></td
                          >
                        </tr>
                        <tr>
                          <td class="px-4 py-3 text-sm font-medium">Website</td>
                          <td class="px-4 py-3 text-sm"
                            ><a
                              href="https://www.brightbroom.co.za"
                              target="_blank"
                              rel="noopener noreferrer"
                              class="text-primary-600 dark:text-primary-400 hover:underline"
                              >www.brightbroom.co.za</a
                            ></td
                          >
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              {/if}
            </section>

            <!-- Annexure A - Definitions -->
            <section id="annexureA" class="scroll-mt-20 mt-8">
              <h2
                class="text-xl font-bold text-gray-900 dark:text-white p-4 bg-gray-100 dark:bg-gray-700 rounded-lg"
              >
                ANNEXURE A - DEFINITIONS
              </h2>

              <div
                class="mt-4 pl-4 pr-2 text-gray-700 dark:text-gray-300 space-y-4"
              >
                <p>
                  1. <strong>"Associates"</strong> means the shareholders, the directors,
                  employees and consultants of BB.
                </p>

                <p>
                  2. <strong>"Cookie"</strong> means a small file that is placed
                  on your device when you visit a website. In this Policy, a reference
                  to a "Cookie" includes analogous technologies such as web beacons
                  and clear Graphic Interchange Format files ("GIFs").
                </p>

                <p>
                  3. <strong>"Operator"</strong> means any person or entity that
                  Processes Personal Information on behalf of the Responsible Party.
                </p>

                <p>
                  4. <strong>"Personal Information"</strong> means information that
                  is about any individual, or from which any individual is directly
                  or indirectly identifiable, in particular by reference to an identifier
                  such as a name, an identification number, location data, an online
                  identifier or to one or more factors specific to the physical,
                  physiological, genetic, mental, economic, cultural or social identity
                  of that individual.
                </p>

                <p>
                  5. <strong>"POPIA"</strong> means the Protection of Personal Information
                  Act 4 of 2013.
                </p>

                <p>
                  6. <strong>"Process"</strong>, <strong>"Processing"</strong>
                  or <strong>"Processed"</strong> means anything that is done with
                  any Personal Information, whether or not by automated means, such
                  as collection, recording, organisation, structuring, storage, adaptation
                  or alteration, retrieval, consultation, use, disclosure by transmission,
                  dissemination or otherwise making available, alignment or combination,
                  restriction, erasure or destruction.
                </p>

                <p>
                  7. <strong>"Responsible Party"</strong> means the entity that decides
                  how and why Personal Information is Processed.
                </p>

                <p>
                  8. <strong>"Sensitive Personal Information"</strong> means Personal
                  Information about race or ethnicity, political opinions, religious
                  or philosophical beliefs, trade union membership, physical or mental
                  health, sexual life, any actual or alleged criminal offences or
                  penalties, national identification number, or any other information
                  that may be deemed to be sensitive under applicable law.
                </p>

                <p>
                  9. <strong>"Service Provider"</strong> – third party providers
                  of various services whom we engage, including, but not limited
                  to, providers of information technology, communication, file storage,
                  data storage, copying, printing, accounting or auditing services,
                  attorneys, debt collectors, counsel, experts, investigators, translators,
                  taxation consultants, our insurers and professional advisors.
                </p>

                <p>
                  10. <strong>"Website"</strong> means any website operated, or maintained,
                  by us or on our behalf.
                </p>
              </div>
            </section>
          </div>

          <!-- Footer -->
          <div class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p class="text-center text-gray-500 dark:text-gray-400 text-sm">
              © {new Date().getFullYear()} BrightBroom (Pty) Ltd. All rights reserved.
            </p>
          </div>
        </div>
      </main>
    </div>
  </div>
</div>

<style>
  /* Add custom styles for smooth expanding/collapsing */
  .privacy-content section {
    transition: max-height 0.3s ease-in-out;
  }

  /* Improve link styling */
  a {
    text-decoration: none;
    color: #20c3af;
    transition: color 0.2s;
  }

  a:hover {
    text-decoration: underline;
  }

  /* Dark mode text colors */
  @media (prefers-color-scheme: dark) {
    a {
      color: #5fd4c3;
    }
  }

  /* Fix sidebar height on larger screens */
  @media (min-width: 768px) {
    aside {
      max-height: calc(100vh - 2rem);
      position: sticky;
      top: 2rem;
    }
  }
</style>
