<script>
  import { onMount } from "svelte";

  // State for collapsible sections
  let expandedSections = {};

  // Define all sections for the Terms of Use
  const sections = [
    { id: "purpose", title: "1. Purpose of Terms" },
    { id: "changes", title: "2. Changes and Modifications" },
    { id: "interpretation", title: "3. Interpretation" },
    { id: "obligations", title: "4. Obligation of the Service" },
    { id: "your-obligations", title: "5. Your Obligations" },
    { id: "data", title: "6. Data" },
    { id: "payments", title: "7. Payments and Fees" },
    { id: "intellectual-property", title: "8. Intellectual Property" },
    { id: "confidentiality", title: "9. Confidentiality" },
    { id: "warranties", title: "10. Warranties" },
    { id: "liability", title: "11. Liability" },
    { id: "termination", title: "12. Term, Termination and Suspension" },
    { id: "general", title: "13. General" },
  ];

  // Initialise all sections as collapsed
  onMount(() => {
    sections.forEach((section) => {
      expandedSections[section.id] = false;
    });
    // Default first section to be expanded
    expandedSections["purpose"] = true;
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

  // Format date for display
  const lastUpdated = "November 9, 2021";
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
              TERMS OF USE
            </h1>
            <p class="text-center text-gray-600 dark:text-gray-400">
              Last updated: {lastUpdated}
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

          <!-- Terms Content -->
          <div class="space-y-6 terms-content">
            <!-- 1. Purpose of Terms -->
            <section id="purpose" class="scroll-mt-20">
              <div
                class="cursor-pointer select-none bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 p-3 md:p-4 rounded-lg flex justify-between items-center"
                on:click={() => toggleSection("purpose")}
              >
                <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                  1. PURPOSE OF TERMS
                </h2>
                <svg
                  class={`w-5 h-5 transition-transform ${expandedSections["purpose"] ? "rotate-180" : ""}`}
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

              {#if expandedSections["purpose"]}
                <div
                  class="mt-4 pl-4 pr-2 text-gray-700 dark:text-gray-300 space-y-4"
                >
                  <p>
                    1.1 These Terms apply to your use of the Service (as that
                    term is defined below). By setting up an account / accessing
                    and using the Service:
                  </p>
                  <div class="pl-6">
                    <p>1.1.1 you agree to these Terms; and</p>
                    <p>
                      1.1.2 where your access and use are on behalf of another
                      person (e.g., a company), you confirm that you are
                      authorised to, and do in fact, agree to these Terms on
                      that person's behalf and that, by agreeing to these Terms
                      on that person's behalf, that person is bound by these
                      Terms.
                    </p>
                  </div>

                  <p>
                    1.2 You also understand the nature of our service and
                    business, as described in clauses below:
                  </p>
                  <div class="pl-6">
                    <p>
                      1.2.1 We do not provide cleaning and general labour
                      services, and the company is not a cleaning and general
                      labour service provider. It is up to an individual service
                      provider registered on the website to offer services that
                      may be scheduled using the website or software. We offer
                      information and a method to obtain services (such as
                      cleaning), but we do not and do not intend to provide such
                      services or act in any way as the service provider, and
                      individual service provider.
                    </p>

                    <p>
                      1.2.2 By using a service provider who is offering their
                      services through the website or software, you agree and
                      understand that such a service provider is an independent
                      contractor. The fact that such a service provider markets
                      their services through the website or the software does
                      not in any way create, establish or set up an agency,
                      partnership or employment relationship between us and such
                      the service provider.
                    </p>

                    <p>
                      1.2.3 The Website and Software are a communications
                      platform for enabling the link between individuals seeking
                      to obtain services offered by service providers and/or
                      individuals seeking to provide services, such as:
                    </p>
                    <div class="pl-6">
                      <p>1.2.3.1 home cleaning,</p>
                      <p>1.2.3.2 office cleaning,</p>
                      <p>1.2.3.3 outdoor cleaning,</p>
                    </div>
                  </div>

                  <p>
                    1.3 You take on certain risks, liabilities and
                    responsibilities and certain risks, liabilities and
                    responsibilities of our Service are excluded. You are
                    responsible for taking all security measures when engaging
                    with a service provider.
                  </p>

                  <p>
                    1.4 If you do not agree to these Terms, you are not
                    authorised to access and use the Service, and you must
                    immediately stop doing so.
                  </p>
                </div>
              {/if}
            </section>

            <!-- 2. Changes and Modifications -->
            <section id="changes" class="scroll-mt-20">
              <div
                class="cursor-pointer select-none bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 p-3 md:p-4 rounded-lg flex justify-between items-center"
                on:click={() => toggleSection("changes")}
              >
                <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                  2. CHANGES AND MODIFICATIONS
                </h2>
                <svg
                  class={`w-5 h-5 transition-transform ${expandedSections["changes"] ? "rotate-180" : ""}`}
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

              {#if expandedSections["changes"]}
                <div
                  class="mt-4 pl-4 pr-2 text-gray-700 dark:text-gray-300 space-y-4"
                >
                  <p>
                    2.1 We may change these Terms at any time by notifying you
                    of the change by email or by posting a notice on the
                    Website. Unless stated otherwise, any change takes effect
                    from the date set out in the notice. You are responsible for
                    ensuring you are familiar with the latest Terms. By
                    continuing to access and use the Service from the date on
                    which the Terms are changed, you agree to be bound by the
                    changed Terms.
                  </p>

                  <p>2.2 These Terms were last updated on 9 November 2021.</p>
                </div>
              {/if}
            </section>

            <!-- 3. Interpretation -->
            <section id="interpretation" class="scroll-mt-20">
              <div
                class="cursor-pointer select-none bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 p-3 md:p-4 rounded-lg flex justify-between items-center"
                on:click={() => toggleSection("interpretation")}
              >
                <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                  3. INTERPRETATION
                </h2>
                <svg
                  class={`w-5 h-5 transition-transform ${expandedSections["interpretation"] ? "rotate-180" : ""}`}
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

              {#if expandedSections["interpretation"]}
                <div
                  class="mt-4 pl-4 pr-2 text-gray-700 dark:text-gray-300 space-y-4"
                >
                  <p>3.1 In these Terms:</p>
                  <div class="pl-6 space-y-2">
                    <p>
                      3.1.1 <strong>BrightBroom Software</strong> means the website,
                      related mobile sites and software applications owned by us
                      (and our licensors) that is used to provide the Service.
                    </p>

                    <p>
                      3.1.2 <strong>Confidential Information</strong> means any information
                      that is not public knowledge and that is obtained from the
                      other party during, or in connection with, the provision and
                      use of the Service. Our Confidential Information includes Intellectual
                      Property owned by us (or our licensors), including the BrightBroom
                      Software. Your Confidential Information includes the Data.
                    </p>

                    <p>
                      3.1.3 <strong>Data</strong> means all data, content, and information
                      (including personal information) owned, held, used or created
                      by you or on your behalf that is stored using, or inputted
                      into, the Software.
                    </p>

                    <p>
                      3.1.4 <strong>Fees</strong> mean the applicable fees set out
                      on our pricing page on the website, related mobile sites and
                      software applications or as agreed otherwise in writing between
                      you and us, as may be updated from time to time under clause
                      7.6.
                    </p>

                    <p>
                      3.1.5 <strong>Force Majeure</strong> means any event that is
                      beyond the reasonable control of a party, excluding:
                    </p>
                    <div class="pl-6">
                      <p>3.1.5.1 a lack of funds for any reason; or</p>
                      <p>
                        3.1.5.2 an event to the extent that it could have been
                        avoided by a party taking reasonable steps or reasonable
                        care.
                      </p>
                      <p>
                        3.1.5.3 including and similar words do not imply any
                        limit.
                      </p>
                    </div>

                    <p>
                      3.1.6 <strong>Intellectual Property Rights</strong> includes
                      copyright and all rights existing anywhere in the world conferred
                      under statute, common law or equity relating to inventions
                      (including patents), registered and unregistered trademarks
                      and designs, circuit layouts, data and databases, confidential
                      information, know-how, and all other rights resulting from
                      intellectual activity. Intellectual Property has a consistent
                      meaning and includes any enhancement, modification or derivative
                      work of the Intellectual Property.
                    </p>

                    <p>
                      3.1.7 <strong>Objectionable</strong> includes being objectionable,
                      defamatory, obscene, harassing, threatening, harmful, or unlawful
                      in any way.
                    </p>

                    <p>
                      3.1.8 a <strong>party</strong> includes that party's permitted
                      assigns.
                    </p>

                    <p>
                      3.1.9 a <strong>person</strong> includes an individual, a body
                      corporate, an association of persons (whether corporate or
                      not), a trust, a government department, or any other entity.
                    </p>

                    <p>
                      3.1.10 <strong>personal information</strong> means information
                      about an identifiable, living person.
                    </p>

                    <p>
                      3.1.11 <strong>personnel</strong> include officers, employees,
                      contractors and agents, but a reference to your personnel does
                      not include us.
                    </p>

                    <p>
                      3.1.12 <strong>Service</strong> means the service having the
                      core functionality described on the Website, as the Website
                      is updated from time to time.
                    </p>

                    <p>
                      3.1.13 a <strong>service provider</strong> is an independent
                      contractor providing such service as but not limited to.
                    </p>

                    <p>
                      3.1.14 <strong>Start Date</strong> means the date that you
                      set up an account / first access or use the Service.
                    </p>

                    <p>
                      3.1.15 <strong>Terms</strong> means these terms and conditions
                      titled BrightBroom Terms of Use.
                    </p>

                    <p>
                      3.1.16 <strong>Underlying Systems</strong> means the BrightBroom
                      Software, IT solutions, systems and networks (including software
                      and hardware) used to provide the Service, including any third-party
                      solutions, systems and networks.
                    </p>

                    <p>
                      3.1.17 <strong>We, us or our</strong> means BrightBroom (Pty)
                      Ltd, company number 2020/440020/07.
                    </p>

                    <p>
                      3.1.18 <strong>Website</strong> means the internet site at
                      brightbroom.com, related mobile-sites and software applications,
                      or such other site notified to you by us.
                    </p>

                    <p>
                      3.1.19 <strong>Year</strong> means 12 months starting on the
                      Start Date or the anniversary of that date.
                    </p>

                    <p>
                      3.1.20 <strong>You or your</strong> means you or, if clause
                      1.1.1 applies, both you and the other person on whose behalf
                      you are acting.
                    </p>

                    <p>
                      3.1.21 Words in the singular include the plural and vice
                      versa.
                    </p>

                    <p>
                      3.1.22 A reference to a statute includes references to
                      regulations, orders or notices made under or in connection
                      with the statute or regulations and all amendments,
                      replacements or other changes to any of them.
                    </p>
                  </div>
                </div>
              {/if}
            </section>

            <!-- 4. Obligation of the Service -->
            <section id="obligations" class="scroll-mt-20">
              <div
                class="cursor-pointer select-none bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 p-3 md:p-4 rounded-lg flex justify-between items-center"
                on:click={() => toggleSection("obligations")}
              >
                <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                  4. OBLIGATION OF THE SERVICE
                </h2>
                <svg
                  class={`w-5 h-5 transition-transform ${expandedSections["obligations"] ? "rotate-180" : ""}`}
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

              {#if expandedSections["obligations"]}
                <div
                  class="mt-4 pl-4 pr-2 text-gray-700 dark:text-gray-300 space-y-4"
                >
                  <p>
                    4.1 We must use reasonable efforts to provide the Service:
                  </p>
                  <div class="pl-6">
                    <p>
                      4.1.1 following these Terms and the Republic of South
                      African law;
                    </p>
                    <p>
                      4.1.2 exercising reasonable care, skill and diligence; and
                    </p>
                    <p>
                      4.1.3 using suitably skilled, experienced and qualified
                      personnel.
                    </p>
                  </div>

                  <p>
                    4.2 Our provision of the Service to you is non-exclusive.
                    Nothing in these Terms prevents us from providing the
                    Service to any other person.
                  </p>

                  <p>
                    4.3 We must use reasonable efforts to ensure the Service is
                    available on a daily basis. However, it is possible that on
                    occasion the Service may be unavailable to permit
                    maintenance or other development activity to take place, or
                    in the event of Force Majeure. We must use reasonable
                    efforts to publish on the Website advance details of any
                    unavailability.
                  </p>

                  <p>
                    4.4 Using web services and APIs, the Service interoperates
                    with a range of third-party service features. We do not make
                    any warranty or representation on the availability of those
                    features. Without limiting the previous sentence, if a
                    third-party feature provider ceases to provide that feature
                    or ceases to make that feature available on reasonable
                    terms, we may cease to make available that feature to you.
                    To avoid doubt, if we exercise our right to cease the
                    availability of a third-party feature, you are not entitled
                    to any refund, discount or other compensation.
                  </p>
                </div>
              {/if}
            </section>

            <!-- 5. Your Obligations -->
            <section id="your-obligations" class="scroll-mt-20">
              <div
                class="cursor-pointer select-none bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 p-3 md:p-4 rounded-lg flex justify-between items-center"
                on:click={() => toggleSection("your-obligations")}
              >
                <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                  5. YOUR OBLIGATIONS
                </h2>
                <svg
                  class={`w-5 h-5 transition-transform ${expandedSections["your-obligations"] ? "rotate-180" : ""}`}
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

              {#if expandedSections["your-obligations"]}
                <div
                  class="mt-4 pl-4 pr-2 text-gray-700 dark:text-gray-300 space-y-4"
                >
                  <p>5.1 You and your personnel must:</p>
                  <div class="pl-6">
                    <p>
                      5.1.1 use the Service following these Terms solely for:
                    </p>
                    <p>
                      5.1.2 your personal use to book or request service from a
                      domestic worker presented on the website; and
                    </p>
                    <p>
                      5.1.3 lawful purposes (including complying with the
                      Electronic Communications and Transactions Act 25 of
                      2002); and
                    </p>
                    <p>
                      5.1.4 not resell or make available the Service to any
                      third party, or otherwise commercially exploit the
                      Service.
                    </p>
                  </div>

                  <p>
                    5.2 When accessing the Service, you and your personnel must:
                  </p>
                  <div class="pl-6">
                    <p>
                      5.2.1 not impersonate another person or misrepresent
                      authorisation to act on behalf of others or us;
                    </p>
                    <p>
                      5.2.2 correctly identify the sender of all electronic
                      transmissions;
                    </p>
                    <p>
                      5.2.3 not attempt to undermine the security or integrity
                      of the Underlying Systems;
                    </p>
                    <p>
                      5.2.4 not use, or misuse, the Service in any way which may
                      impair the functionality of the Underlying Systems or
                      impair the ability of any other user to use the Service;
                    </p>
                    <p>
                      5.2.5 not attempt to view, access or copy any material or
                      data other than:
                    </p>
                    <div class="pl-6">
                      <p>
                        5.2.5.1 that which you are authorised to access; and
                      </p>
                      <p>
                        5.2.5.2 to the extent necessary for you to use the
                        Service following these Terms; and
                      </p>
                      <p>
                        5.2.5.3 neither use the Service in a manner nor
                        transmit, input or store any Data, that breaches any
                        third party right (including Intellectual Property
                        Rights and privacy rights) or is Objectionable,
                        incorrect or misleading.
                      </p>
                    </div>
                  </div>

                  <p>
                    5.3 A breach of any of these Terms by your personnel is
                    deemed to be a breach of these Terms by you.
                  </p>

                  <p>
                    5.4 You are responsible for procuring all licences,
                    authorisations and consents required for you and your
                    personnel to use the Service, including to use, store and
                    input Data into, and process and distribute Data through,
                    the Service.
                  </p>
                </div>
              {/if}
            </section>

            <!-- 6. Data -->
            <section id="data" class="scroll-mt-20">
              <div
                class="cursor-pointer select-none bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 p-3 md:p-4 rounded-lg flex justify-between items-center"
                on:click={() => toggleSection("data")}
              >
                <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                  6. DATA
                </h2>
                <svg
                  class={`w-5 h-5 transition-transform ${expandedSections["data"] ? "rotate-180" : ""}`}
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

              {#if expandedSections["data"]}
                <div
                  class="mt-4 pl-4 pr-2 text-gray-700 dark:text-gray-300 space-y-4"
                >
                  <p>6.1 You acknowledge that:</p>
                  <div class="pl-6">
                    <p>
                      6.1.1 we may require access to the Data to exercise our
                      rights and perform our obligations under these Terms; and
                    </p>
                    <p>
                      6.1.2 to the extent that this is necessary but subject to
                      clause 9, we may authorise a member or members of our
                      personnel to access the Data for this purpose.
                    </p>
                  </div>

                  <p>
                    6.2 You must arrange all consents and approvals that are
                    necessary for us to access the Data as described in clause
                    6.1.
                  </p>

                  <p>6.3 You acknowledge and agree that we may:</p>
                  <div class="pl-6">
                    <p>
                      6.3.1 use Data and information about your use of the
                      Service to generate anonymised and aggregated statistical
                      and analytical data (Analytical Data); and
                    </p>
                    <p>
                      6.3.2 use Analytical Data for our internal research and
                      product development purposes and to conduct statistical
                      analysis and identify trends and insights; and
                    </p>
                    <p>6.3.3 supply Analytical Data to third parties;</p>
                    <p>
                      6.3.4 our rights under clause 6.3.1 above will survive
                      termination or expiry of these Terms; and
                    </p>
                    <p>
                      6.3.5 title to, and all Intellectual Property Rights in,
                      Analytical Data is and remains our property.
                    </p>
                  </div>

                  <p>
                    6.4 You acknowledge and agree that to the extent Data
                    contains personal information, in collecting, holding and
                    processing that information through the Service, we are
                    acting as your agent for the Protection of Personal
                    Information Act 4 of 2013 and any other applicable privacy
                    law. You must obtain all necessary consents from the
                    relevant individual to enable us to collect, use, hold and
                    process that information following these Terms.
                  </p>

                  <p>
                    6.5 While we will take standard industry measures to back up
                    all Data stored using the Service, you agree to keep a
                    separate backup copy of all Data uploaded by you onto the
                    Service.
                  </p>

                  <p>
                    6.6 You agree that we may store Data (including any personal
                    information) in secure servers outside the Republic of South
                    Africa and may access that Data (including any personal
                    information) outside the Republic of South Africa and in the
                    Republic of South Africa from time to time.
                  </p>

                  <p>
                    6.7 You indemnify us against any liability, claim,
                    proceeding, cost, expense (including the actual legal fees
                    charged by our Attorneys) and loss of any kind arising from
                    any actual or alleged claim by a third party that any Data
                    infringes the rights of that third party (including
                    Intellectual Property Rights and privacy rights) or that the
                    Data is Objectionable, incorrect or misleading.
                  </p>
                </div>
              {/if}
            </section>

            <!-- 7. Payments and Fees -->
            <section id="payments" class="scroll-mt-20">
              <div
                class="cursor-pointer select-none bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 p-3 md:p-4 rounded-lg flex justify-between items-center"
                on:click={() => toggleSection("payments")}
              >
                <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                  7. PAYMENTS AND FEES
                </h2>
                <svg
                  class={`w-5 h-5 transition-transform ${expandedSections["payments"] ? "rotate-180" : ""}`}
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

              {#if expandedSections["payments"]}
                <div
                  class="mt-4 pl-4 pr-2 text-gray-700 dark:text-gray-300 space-y-4"
                >
                  <p>7.1 You must pay us the Fees.</p>

                  <p>
                    7.2 We will provide you with valid VAT invoices/receipts on
                    a per booking (service request) basis on the date of
                    payment.
                  </p>

                  <p>
                    7.3 The Fees include VAT, which you must pay on taxable
                    supplies.
                  </p>

                  <p>7.4 You must pay the Fees:</p>
                  <div class="pl-6">
                    <p>
                      7.4.1 following the payment terms set out on our pricing
                      page on the Website; and
                    </p>
                    <p>
                      7.4.2 electronically in cleared funds without any set-off
                      or deduction.
                    </p>
                  </div>

                  <p>
                    7.5 We may increase the Fees as and when we see the need to
                    and this will be updated on the website. If you do not wish
                    to pay the increased Fees, you may terminate these Terms and
                    your right to access and use the Service. If you do not
                    terminate these Terms and your right to access and use the
                    Service under this clause, you are deemed to have accepted
                    the increased Fees.
                  </p>
                </div>
              {/if}
            </section>

            <!-- 8. Intellectual Property -->
            <section id="intellectual-property" class="scroll-mt-20">
              <div
                class="cursor-pointer select-none bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 p-3 md:p-4 rounded-lg flex justify-between items-center"
                on:click={() => toggleSection("intellectual-property")}
              >
                <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                  8. INTELLECTUAL PROPERTY
                </h2>
                <svg
                  class={`w-5 h-5 transition-transform ${expandedSections["intellectual-property"] ? "rotate-180" : ""}`}
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

              {#if expandedSections["intellectual-property"]}
                <div
                  class="mt-4 pl-4 pr-2 text-gray-700 dark:text-gray-300 space-y-4"
                >
                  <p>
                    8.1 Subject to clause 8.2, title to, and all Intellectual
                    Property Rights in, the Service, the Website, and all
                    Underlying Systems will remain our property (and our
                    licensors' property). You must not contest or dispute that
                    ownership, or the validity of those Intellectual Property
                    Rights.
                  </p>

                  <p>
                    8.2 Title to, and all Intellectual Property Rights in, the
                    Data (as between the parties) remains your property. You
                    grant us a worldwide, non-exclusive, fully paid up,
                    transferable, irrevocable licence to use, store, copy,
                    modify, make available and communicate the Data for any
                    purpose in connection with the exercise of our rights and
                    performance of our obligations by these Terms.
                  </p>

                  <p>
                    8.3 To the extent not owned by us, you grant us a
                    royalty-free, transferable, irrevocable and perpetual
                    licence to use for our business purposes any know-how,
                    techniques, ideas, methodologies, and similar Intellectual
                    Property used by us in the provision of the Service.
                  </p>

                  <p>
                    8.4 If you provide us with ideas, comments or suggestions
                    relating to the Service or Underlying Systems (together with
                    feedback):
                  </p>
                  <div class="pl-6">
                    <p>
                      8.4.1 all Intellectual Property Rights in that feedback,
                      and anything created because of that feedback (including
                      new material, enhancements, modifications or derivative
                      works), are owned solely by us; and
                    </p>
                    <p>
                      8.4.2 we may use or disclose the feedback for any purpose.
                    </p>
                  </div>

                  <p>
                    8.5 You acknowledge that the Service may link to third-party
                    websites or feeds that are connected or relevant to the
                    Service. Any link from the Service does not imply that we
                    endorse, approve or recommend, or have responsibility for,
                    those websites or feeds or their content or operators. To
                    the maximum extent permitted by law, we exclude all
                    responsibility or liability for those websites or feeds.
                  </p>
                </div>
              {/if}
            </section>

            <!-- Remaining sections would follow the same pattern -->
            <!-- For brevity, I'll include just a few more key sections and summarize the rest -->

            <!-- 9. Confidentiality -->
            <section id="confidentiality" class="scroll-mt-20">
              <div
                class="cursor-pointer select-none bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 p-3 md:p-4 rounded-lg flex justify-between items-center"
                on:click={() => toggleSection("confidentiality")}
              >
                <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                  9. CONFIDENTIALITY
                </h2>
                <svg
                  class={`w-5 h-5 transition-transform ${expandedSections["confidentiality"] ? "rotate-180" : ""}`}
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

              {#if expandedSections["confidentiality"]}
                <div
                  class="mt-4 pl-4 pr-2 text-gray-700 dark:text-gray-300 space-y-4"
                >
                  <p>
                    9.1 Each party must, unless it has the prior written consent
                    of the other party:
                  </p>
                  <div class="pl-6">
                    <p>
                      9.1.1 Always keep confidential the Confidential
                      Information of the other party;
                    </p>
                    <p>
                      9.1.2 effect and maintain adequate security measures to
                      safeguard the other party's Confidential Information from
                      unauthorised access or use; and
                    </p>
                    <p>
                      9.1.3 disclose the other party's Confidential Information
                      to its personnel or professional advisors on a
                      need-to-know basis only and, in that case, ensure that any
                      personnel or professional advisor to whom it discloses the
                      other party's Confidential Information is aware of and
                      complies with, clauses 9.1.1 and 9.1.2.
                    </p>
                  </div>

                  <p>
                    9.2 The obligation of confidentiality in clause 9.1 does not
                    apply to any disclosure or use of Confidential Information:
                  </p>
                  <div class="pl-6">
                    <p>
                      9.2.1 to perform a party's obligations, or exercise a
                      party's rights, under these Terms;
                    </p>
                    <p>
                      9.2.2 required by law (including under the rules of any
                      stock exchange);
                    </p>
                    <p>
                      9.2.3 which is publicly available through no fault of the
                      recipient of the Confidential Information or its
                      personnel;
                    </p>
                    <p>
                      9.2.4 which was rightfully received by a party from a
                      third party without restriction and breach of any
                      obligation of confidentiality; or
                    </p>
                    <p>
                      9.2.5 by us, if required as part of a bona fide sale of
                      our business (assets or shares, whether in whole or in
                      part) to a third party, if we enter into a confidentiality
                      agreement with the third party on terms no less
                      restrictive than this clause 9.
                    </p>
                  </div>
                </div>
              {/if}
            </section>

            <!-- 10. Warranties -->
            <section id="warranties" class="scroll-mt-20">
              <div
                class="cursor-pointer select-none bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 p-3 md:p-4 rounded-lg flex justify-between items-center"
                on:click={() => toggleSection("warranties")}
              >
                <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                  10. WARRANTIES
                </h2>
                <svg
                  class={`w-5 h-5 transition-transform ${expandedSections["warranties"] ? "rotate-180" : ""}`}
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

              {#if expandedSections["warranties"]}
                <div
                  class="mt-4 pl-4 pr-2 text-gray-700 dark:text-gray-300 space-y-4"
                >
                  <p>
                    10.1 Each party warrants that it has full power and
                    authority to enter into, and perform its obligations under,
                    these Terms.
                  </p>

                  <p>10.2 To the maximum extent permitted by law:</p>
                  <div class="pl-6">
                    <p>
                      10.2.1 our warranties are limited to those set out in
                      these Terms, and all other conditions, guarantees or
                      warranties whether expressed or implied by statute or
                      otherwise (including any warranty under the Consumer
                      Protection Act 68 of 2008) are expressly excluded; and
                    </p>
                    <p>
                      10.2.2 we make no representation concerning the quality of
                      the Service and do not promise that the Service will:
                    </p>
                    <div class="pl-6">
                      <p>
                        10.2.2.1 meet your requirements or be suitable for a
                        particular purpose; or
                      </p>
                      <p>
                        10.2.2.2 be secure, free of viruses or other harmful
                        code, uninterrupted or error-free.
                      </p>
                    </div>
                  </div>

                  <p>
                    10.3 You agree and represent that you are acquiring the
                    Service, and accepting these Terms, for trade. The parties
                    agree that:
                  </p>
                  <div class="pl-6">
                    <p>
                      10.3.1 to the maximum extent permissible by law, the
                      Consumer Protection Act 68 of 2008 and any other
                      applicable consumer protection legislation does not apply
                      to the supply of the Service or these Terms; and
                    </p>
                    <p>
                      10.3.2 it is fair and reasonable that the parties are
                      bound by clause 10.3.
                    </p>
                  </div>

                  <p>
                    10.4 Where legislation or rule of law implies into these
                    Terms a condition or warranty that cannot be excluded or
                    modified by contract, the condition or warranty is deemed to
                    be included in these Terms. However, our liability for any
                    breach of that condition or warranty is limited, at our
                    option, to:
                  </p>
                  <div class="pl-6">
                    <p>10.4.1 supplying the Service again; and/or</p>
                    <p>
                      10.4.2 paying the costs of having the Service supplied
                      again.
                    </p>
                  </div>
                </div>
              {/if}
            </section>

            <!-- 11. Liability -->
            <section id="liability" class="scroll-mt-20">
              <div
                class="cursor-pointer select-none bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 p-3 md:p-4 rounded-lg flex justify-between items-center"
                on:click={() => toggleSection("liability")}
              >
                <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                  11. LIABILITY
                </h2>
                <svg
                  class={`w-5 h-5 transition-transform ${expandedSections["liability"] ? "rotate-180" : ""}`}
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

              {#if expandedSections["liability"]}
                <div
                  class="mt-4 pl-4 pr-2 text-gray-700 dark:text-gray-300 space-y-4"
                >
                  <p class="text-primary-600 dark:text-primary-400 font-medium">
                    This section contains important limitations on our
                    liability. Please read carefully.
                  </p>

                  <p>
                    11.1 To the extent permitted by applicable law, in no event
                    shall our aggregate liability exceed the amounts paid by
                    and/or due from you in the six (6) month period immediately
                    preceding the event giving rise to such claim.
                  </p>

                  <p>
                    11.2 Neither party is liable to the other under or in
                    connection with these Terms or the Service for any:
                  </p>
                  <div class="pl-6">
                    <p>
                      11.2.1 loss of profit, revenue, savings, business, use,
                      data (including Data), and/or goodwill; or
                    </p>
                    <p>
                      11.2.2 consequential, indirect, incidental or special
                      damage or loss of any kind.
                    </p>
                  </div>

                  <p>
                    11.3 Clauses 11.1 and 11.2 do not apply to limit our
                    liability under or in connection with these Terms for:
                  </p>
                  <div class="pl-6">
                    <p>11.3.1 personal injury or death;</p>
                    <p>11.3.2 fraud or wilful misconduct; or</p>
                    <p>11.3.3 a breach of clause 9.</p>
                  </div>

                  <p>
                    11.4 Clause 11.2 does not apply to limit your liability:
                  </p>
                  <div class="pl-6">
                    <p>11.4.1 to charges on fees;</p>
                    <p>11.4.2 under the indemnity in clause 6.7; or</p>
                    <p>
                      11.4.3 for those matters stated in clauses 11.3.1 to
                      11.3.3.
                    </p>
                  </div>

                  <p>
                    11.5 Neither party will be responsible, liable, or held to
                    be in breach of these Terms for any failure to perform its
                    obligations under these Terms or otherwise, to the extent
                    that the failure is caused by the other party failing to
                    comply with its obligations under these Terms, or by the
                    negligence or misconduct of the other party or its
                    personnel.
                  </p>

                  <p>
                    11.6 Each party must take reasonable steps to mitigate any
                    loss or damage, cost or expense it may suffer or incur
                    arising out of anything done or not done by the other party
                    under or in connection with these Terms or the Service.
                  </p>

                  <p>
                    11.7 We may introduce you to third-party service providers
                    (i.e., service providers that are not registered on the
                    Platform) to provide services. We will not assess the
                    suitability, legality or ability of any third-party service
                    providers and you expressly waive and release us from all
                    liability, claims or damages arising from or in any way
                    related to the third-party service provider. We will not be
                    a party to disputes, negotiations of disputes between you
                    and such third-party cleaning providers. Responsibility for
                    the decisions you make regarding services offered via the
                    Software or Website (with all its implications) rests solely
                    with you. We will not assess the suitability, legality or
                    ability of any such third-party service provider and you
                    expressly waive and release us from all liability, claims,
                    causes of action, or damages arising from your use of the
                    Software or Website, or in any way related to the
                    third-party service providers introduced to you by the
                    Software or Website.
                  </p>

                  <p>
                    11.8 The quality of the services scheduled using the Website
                    or Software with a third-party service provider is entirely
                    the responsibility of the third-party service provider who
                    ultimately provides such services to you. Nothing on the
                    Website or Software constitutes, or is meant to constitute,
                    advice of any kind. If you require advice concerning any
                    legal, financial or medical matter you should consult an
                    appropriate professional.
                  </p>

                  <p>
                    11.9 By using the service or software, you agree that the
                    exclusions and limitations of liability set out in this
                    agreement are reasonable. If you do not think they are
                    reasonable, you must not use the service or software.
                  </p>
                </div>
              {/if}
            </section>

            <!-- 12. Term, Termination and Suspension -->
            <section id="termination" class="scroll-mt-20">
              <div
                class="cursor-pointer select-none bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 p-3 md:p-4 rounded-lg flex justify-between items-center"
                on:click={() => toggleSection("termination")}
              >
                <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                  12. TERM, TERMINATION AND SUSPENSION
                </h2>
                <svg
                  class={`w-5 h-5 transition-transform ${expandedSections["termination"] ? "rotate-180" : ""}`}
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

              {#if expandedSections["termination"]}
                <div
                  class="mt-4 pl-4 pr-2 text-gray-700 dark:text-gray-300 space-y-4"
                >
                  <p>
                    12.1 Unless terminated under clause 12, these Terms and your
                    right to access and use the Service:
                  </p>
                  <div class="pl-6">
                    <p>12.1.1 starts on the Start Date;</p>
                  </div>

                  <p>
                    12.2 Subject to clause 7.6, if the subscription option you
                    have selected includes a minimum initial term, the earliest
                    date for termination under clause 12.1 will be the expiry of
                    that initial term.
                  </p>

                  <p>
                    12.3 Either party may, by notice to the other party,
                    immediately terminate these Terms and your right to access
                    and use the Service if the other party:
                  </p>
                  <div class="pl-6">
                    <p>
                      12.3.1 breaches any material provision of these Terms and
                      the breach is not:
                    </p>
                    <div class="pl-6">
                      <p>
                        12.3.1.1 remedied within 10 days of the receipt of a
                        notice from the first party requiring it to remedy the
                        breach; or
                      </p>
                      <p>12.3.1.2 capable of being remedied; or</p>
                    </div>
                    <p>
                      12.3.2 becomes insolvent, liquidated or bankrupt, has an
                      administrator, receiver, liquidator, statutory manager,
                      mortgagee's or chargee's agent appointed, becomes subject
                      to any form of insolvency action or external
                      administration, or ceases to continue business for any
                      reason.
                    </p>
                  </div>

                  <p>
                    12.4 You may terminate these Terms and your right to access
                    and use the Service under clause 7.6.
                  </p>

                  <p>
                    12.5 Termination of these Terms does not affect either
                    party's rights or obligations that accrued before that
                    termination.
                  </p>

                  <p>
                    12.6 On termination of these Terms, you must pay all Fees
                    for the provision of the Service before that termination.
                  </p>

                  <p>
                    12.7 No compensation is payable by us to you because of the
                    termination of these Terms for whatever reason, and you will
                    not be entitled to a refund of any Fees that you have
                    already paid.
                  </p>

                  <p>
                    12.8 Except to the extent that a party has ongoing rights to
                    use Confidential Information, at the other party's request
                    following termination of these Terms but subject to clause
                    12.9, a party must promptly return to the other party or
                    destroy all Confidential Information of the other party that
                    is in the first party's possession or control.
                  </p>

                  <p>
                    12.9 At any time before one month after the date of
                    termination, you may request:
                  </p>
                  <div class="pl-6">
                    <p>
                      12.9.1 a copy of any Data stored using the Service
                      provided that you pay our reasonable costs of providing
                      that copy. On receipt of that request, we must provide a
                      copy of the Data in a common electronic form. We do not
                      warrant that the format of the Data will be compatible
                      with any software; and/or
                    </p>
                    <p>
                      12.9.2 deletion of the Data stored using the Service, in
                      which case we must use reasonable efforts to promptly
                      delete that Data.
                    </p>
                  </div>

                  <p>
                    12.10 To avoid doubt, we are not required to comply with
                    clause 12.9.1 to the extent that you have previously
                    requested deletion of the Data.
                  </p>

                  <p>
                    12.11 Without limiting any other right or remedy available
                    to us, we may restrict or suspend your access to and use of
                    the Service and/or delete, edit or remove the relevant Data
                    if we consider that you or any of your personnel have:
                  </p>
                  <div class="pl-6">
                    <p>
                      12.11.1 undermined, or attempted to undermine, the
                      security or integrity of the Service or any Underlying
                      Systems;
                    </p>
                    <p>12.11.2 used, or attempted to use, the Service:</p>
                    <p>12.11.3 for improper purposes; or</p>
                    <p>
                      12.11.4 in a manner, other than for normal operational
                      purposes, that materially reduces the operational
                      performance of the Service;
                    </p>
                    <p>
                      12.11.5 transmitted, inputted or stored any Data that
                      breaches or may breach these Terms or any third party
                      right (including Intellectual Property Rights and privacy
                      rights), or that is or may be Objectionable, incorrect or
                      misleading; or
                    </p>
                    <p>12.11.6 otherwise materially breached these Terms.</p>
                  </div>
                </div>
              {/if}
            </section>

            <!-- 13. General -->
            <section id="general" class="scroll-mt-20">
              <div
                class="cursor-pointer select-none bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 p-3 md:p-4 rounded-lg flex justify-between items-center"
                on:click={() => toggleSection("general")}
              >
                <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                  13. GENERAL
                </h2>
                <svg
                  class={`w-5 h-5 transition-transform ${expandedSections["general"] ? "rotate-180" : ""}`}
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

              {#if expandedSections["general"]}
                <div
                  class="mt-4 pl-4 pr-2 text-gray-700 dark:text-gray-300 space-y-4"
                >
                  <p>
                    13.1 Neither party is liable to the other for any failure to
                    perform its obligations under these Terms to the extent
                    caused by Force Majeure.
                  </p>

                  <p>
                    13.2 No person other than you and us has any right to a
                    benefit under, or to enforce, these Terms.
                  </p>

                  <p>
                    13.3 For us to waive a right under these Terms, that waiver
                    must be in writing and signed by us.
                  </p>

                  <p>
                    13.4 Subject to clause 6.4, we are your independent
                    contractor, and no other relationship (e.g., joint venture,
                    agency, trust or partnership) exists under these Terms.
                  </p>

                  <p>
                    13.5 If we need to contact you, we may do so by email or by
                    posting a notice on the Website. You agree that this
                    satisfies all legal requirements concerning written
                    communications. You may give notice to us under or in
                    connection with these Terms by emailing <a
                      href="mailto:support@brightbroom.com"
                      class="text-primary-600 dark:text-primary-400 hover:underline"
                      >support@brightbroom.com</a
                    >
                    or alternatively
                    <a
                      href="mailto:info@brightbroom.com"
                      class="text-primary-600 dark:text-primary-400 hover:underline"
                      >info@brightbroom.com</a
                    >
                  </p>

                  <p>
                    13.6 These Terms, and any dispute relating to these Terms or
                    the Service, are governed by and must be interpreted under
                    the laws of the Republic of South Africa. Each party submits
                    to the non-exclusive jurisdiction of the Courts of the
                    Republic of South Africa concerning any dispute connected
                    with these Terms or the Service.
                  </p>

                  <p>
                    13.7 Clauses which, by their nature, are intended to survive
                    termination of these Terms, including clauses 6.7, 8, 9, 11,
                    12.5 to 12.9 and 13.6, continue in force.
                  </p>

                  <p>
                    13.8 If any part or provision of these Terms is or becomes
                    illegal, unenforceable, or invalid, that part or provision
                    is deemed to be modified to the extent required to remedy
                    the illegality, unenforceability or invalidity. If
                    modification is not possible, the part or provision must be
                    treated for all purposes as severed from these Terms. The
                    remainder of these Terms will be binding on you.
                  </p>

                  <p>
                    13.9 Subject to clauses 2.1 and 7.6, any variation to these
                    Terms must be in writing and signed by both parties.
                  </p>

                  <p>
                    13.10 These Terms set out everything agreed by the parties
                    relating to the Service, and supersede and cancel anything
                    discussed, exchanged or agreed before the Start Date. The
                    parties have not relied on any representation, warranty or
                    agreement relating to the Service that is not expressly set
                    out in these Terms, and no such representation, warranty or
                    agreement has any effect from the Start Date. Without
                    limiting the previous sentence, the parties agree to
                    contract out of sections 29, 40 and 41 of the Consumer
                    Protection Act 68 of 2008, and that it is fair and
                    reasonable that the parties are bound by this clause 13.10.
                  </p>

                  <p>
                    13.11 You may not assign, novate, subcontract or transfer
                    any right or obligation under these Terms without our prior
                    written consent, that consent not to be unreasonably
                    withheld. You remain liable for your obligations under these
                    Terms despite any approved assignment, subcontracting or
                    transfer.
                  </p>
                </div>
              {/if}
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
  .terms-content section {
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
