(function () {
  'use strict';

  var hamburger = document.getElementById('js-hamburger');
  var mobileMenu = document.getElementById('js-mobile-menu');
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var overlayTriggers = 0;

  function runIntroSequence() {
    var loader = document.getElementById('js-page-loader');
    var started = false;
    var ready = true;
    var minimumDone = false;

    function tryStartScene() {
      if (!ready || !minimumDone) return;
      startScene();
    }

    function startScene() {
      if (started) return;
      started = true;
      if (reducedMotion) {
        document.body.classList.remove('is-intro-loading');
        document.body.classList.add('is-intro-done', 'is-scene-sharp');
        if (loader) loader.hidden = true;
        return;
      }

      document.body.classList.add('is-intro-reveal');
      window.setTimeout(function () {
        document.body.classList.add('is-intro-sharpening');
        document.body.classList.add('is-scene-sharp');
      }, 350);
      window.setTimeout(function () {
        document.body.classList.remove('is-intro-loading', 'is-intro-reveal', 'is-intro-sharpening');
        document.body.classList.add('is-intro-done');
        if (loader) loader.hidden = true;
      }, 950);
    }

    window.setTimeout(function () {
      minimumDone = true;
      tryStartScene();
    }, 450);
    window.setTimeout(function () {
      ready = true;
      minimumDone = true;
      tryStartScene();
    }, 1600);
  }

  runIntroSequence();

  var contactOpen = document.querySelector('.intro-contact__open');
  var contactForm = document.getElementById('intro-contact-form');
  var contactSteps = contactForm ? Array.prototype.slice.call(contactForm.querySelectorAll('[data-contact-step]')) : [];

  function showContactStep(index) {
    contactSteps.forEach(function (step, stepIndex) {
      step.classList.toggle('is-active', stepIndex === index);
      step.classList.remove('is-invalid');
    });
    var field = contactSteps[index] ? contactSteps[index].querySelector('input, textarea') : null;
    if (field) field.focus({ preventScroll: true });
  }

  if (contactOpen && contactForm) {
    contactOpen.addEventListener('click', function () {
      contactOpen.setAttribute('aria-expanded', 'true');
      contactForm.hidden = false;
      contactSteps[0].classList.add('is-active');
      window.setTimeout(function () {
        contactForm.classList.add('is-unfolding');
      }, reducedMotion ? 0 : 20);
    });

    contactForm.querySelectorAll('[data-contact-next]').forEach(function (button, index) {
      button.addEventListener('click', function () {
        var step = contactSteps[index];
        var field = step.querySelector('input, textarea');
        if (!field.checkValidity()) {
          step.classList.add('is-invalid');
          field.reportValidity();
          field.focus();
          return;
        }
        showContactStep(index + 1);
      });
    });

    contactForm.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter' || event.shiftKey || event.target.tagName === 'TEXTAREA') return;
      var activeIndex = contactSteps.findIndex(function (step) { return step.classList.contains('is-active'); });
      if (activeIndex < contactSteps.length - 1) {
        event.preventDefault();
        contactSteps[activeIndex].querySelector('[data-contact-next]').click();
      }
    });

    contactForm.addEventListener('submit', function (event) {
      event.preventDefault();
      var activeStep = contactSteps[contactSteps.length - 1];
      var message = document.getElementById('intro-message');
      if (!message.checkValidity()) {
        activeStep.classList.add('is-invalid');
        message.focus();
        return;
      }
      var name = document.getElementById('intro-name').value.trim();
      var email = document.getElementById('intro-email').value.trim();
      var body = 'Name: ' + name + '\nE-Mail: ' + email + '\n\n' + message.value.trim();
      window.location.href = 'mailto:stefan.pappenberg@gmail.com?body=' + encodeURIComponent(body);
    });
  }

  function setGlassOverlay(active) {
    overlayTriggers += active ? 1 : -1;
    overlayTriggers = Math.max(0, overlayTriggers);
    document.body.classList.toggle('has-glass-overlay', overlayTriggers > 0);
  }

  function closeMobileMenu() {
    if (!hamburger || !mobileMenu) return;
    var wasOpen = mobileMenu.classList.contains('is-open');
    mobileMenu.classList.remove('is-open');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('aria-label', 'Menü öffnen');
    mobileMenu.setAttribute('aria-hidden', 'true');
    if (wasOpen) setGlassOverlay(false);
  }

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', function () {
      var isOpen = mobileMenu.classList.toggle('is-open');
      hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      hamburger.setAttribute('aria-label', isOpen ? 'Menü schließen' : 'Menü öffnen');
      mobileMenu.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
      setGlassOverlay(isOpen);
    });

    mobileMenu.addEventListener('click', function (event) {
      if (event.target.tagName === 'A') closeMobileMenu();
    });
  }

  var bgOpenButtons = document.querySelectorAll('[data-background-open]');
  var bgOpen = document.getElementById('js-background-open');
  var bgPanel = document.getElementById('js-background-panel');
  var bgClose = document.getElementById('js-background-close');
  var bgReset = document.getElementById('js-background-reset');
  var bgFileForm = document.getElementById('js-background-file-form');
  var bgGradientForm = document.getElementById('js-background-gradient-form');
  var bgFileName = document.getElementById('background-file-name');
  var bgColorTop = document.getElementById('background-color-top');
  var bgColorBottom = document.getElementById('background-color-bottom');
  var bgColorLeft = document.getElementById('background-color-left');
  var bgColorRight = document.getElementById('background-color-right');
  var bgColorOpacity = document.getElementById('background-color-opacity');
  var bgColorOpacityValue = document.getElementById('background-color-opacity-value');
  var bgStorageKey = 'pappenbergBackgroundChoice';

  function readBackgroundChoice() {
    try {
      return JSON.parse(localStorage.getItem(bgStorageKey)) || {};
    } catch (error) {
      return {};
    }
  }

  function saveBackgroundChoice(choice) {
    try {
      var stored = readBackgroundChoice();
      if (choice.type === 'image') stored.image = choice.value;
      if (choice.type === 'colors') {
        stored.colors = {
          top: choice.top,
          bottom: choice.bottom,
          left: choice.left,
          right: choice.right,
          opacity: choice.opacity
        };
      }
      localStorage.setItem(bgStorageKey, JSON.stringify(stored));
    } catch (error) {}
  }

  function hexToRgba(hex, alpha) {
    var value = hex.replace('#', '');
    var r = parseInt(value.substring(0, 2), 16);
    var g = parseInt(value.substring(2, 4), 16);
    var b = parseInt(value.substring(4, 6), 16);
    return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')';
  }

  function buildTransparentWash(colors) {
    var opacity = Number(colors.opacity);
    if (Number.isNaN(opacity)) opacity = 100;
    var alpha = Math.max(0, Math.min(100, opacity)) / 100;
    return [
      'radial-gradient(circle at 50% 0%, ' + hexToRgba(colors.top, alpha) + ', transparent 62%)',
      'radial-gradient(circle at 50% 100%, ' + hexToRgba(colors.bottom, alpha) + ', transparent 62%)',
      'radial-gradient(circle at 0% 50%, ' + hexToRgba(colors.left, alpha) + ', transparent 58%)',
      'radial-gradient(circle at 100% 50%, ' + hexToRgba(colors.right, alpha) + ', transparent 58%)',
      'linear-gradient(135deg, ' + hexToRgba(colors.left, alpha) + ', ' + hexToRgba(colors.top, alpha) + ' 32%, ' + hexToRgba(colors.right, alpha) + ' 68%, ' + hexToRgba(colors.bottom, alpha) + ')'
    ].join(', ');
  }

  function getColorChoiceFromControls() {
    return {
      type: 'colors',
      top: bgColorTop.value,
      bottom: bgColorBottom.value,
      left: bgColorLeft.value,
      right: bgColorRight.value,
      opacity: bgColorOpacity ? bgColorOpacity.value : '100'
    };
  }

  function updateOpacityLabel(value) {
    if (bgColorOpacityValue) bgColorOpacityValue.textContent = value + '%';
  }

  function applyBackgroundChoice(choice, persist) {
    if (!choice) return;
    if (choice.type === 'image' && choice.value) {
      document.documentElement.style.setProperty('--scene-bg-image', 'url("' + choice.value + '")');
    }
    if (choice.type === 'colors' && choice.top && choice.bottom && choice.left && choice.right) {
      document.documentElement.style.setProperty('--scene-bg-wash', buildTransparentWash(choice));
      if (bgColorTop) bgColorTop.value = choice.top;
      if (bgColorBottom) bgColorBottom.value = choice.bottom;
      if (bgColorLeft) bgColorLeft.value = choice.left;
      if (bgColorRight) bgColorRight.value = choice.right;
      if (bgColorOpacity) bgColorOpacity.value = choice.opacity || '100';
      updateOpacityLabel(choice.opacity || '100');
    }
    if (choice.type === 'gradient' && choice.a && choice.b) {
      applyBackgroundChoice({
        type: 'colors',
        top: choice.a,
        bottom: choice.b,
        left: choice.a,
        right: choice.b,
        opacity: '100'
      }, false);
    }
    if (persist) saveBackgroundChoice(choice);
  }

  function restoreBackgroundChoice() {
    try {
      var stored = readBackgroundChoice();
      if (stored.type) {
        applyBackgroundChoice(stored, false);
        return;
      }
      if (stored.image) applyBackgroundChoice({ type: 'image', value: stored.image }, false);
      if (stored.colors) {
        applyBackgroundChoice({
          type: 'colors',
          top: stored.colors.top,
          bottom: stored.colors.bottom,
          left: stored.colors.left,
          right: stored.colors.right,
          opacity: stored.colors.opacity || '100'
        }, false);
      }
    } catch (error) {}
  }

  restoreBackgroundChoice();

  if (bgOpenButtons.length && bgPanel) {
    bgOpenButtons.forEach(function (button) {
      button.addEventListener('click', function () {
      var willOpen = bgPanel.hidden;
      bgPanel.hidden = !willOpen;
      bgOpenButtons.forEach(function (trigger) {
        trigger.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      });
      if (willOpen) bgPanel.querySelector('button, input').focus({ preventScroll: true });
      closeMobileMenu();
      });
    });
  }
  if (bgClose && bgPanel) {
    bgClose.addEventListener('click', function () {
      bgPanel.hidden = true;
      bgOpenButtons.forEach(function (trigger) {
        trigger.setAttribute('aria-expanded', 'false');
      });
    });
  }
  document.querySelectorAll('[data-bg-image]').forEach(function (button) {
    button.addEventListener('click', function () {
      applyBackgroundChoice({ type: 'image', value: button.getAttribute('data-bg-image') }, true);
    });
  });
  if (bgFileForm && bgFileName) {
    bgFileForm.addEventListener('submit', function (event) {
      event.preventDefault();
      var file = bgFileName.value.trim().replace(/^\/+/, '');
      if (!file || file.indexOf('..') !== -1) return;
      applyBackgroundChoice({ type: 'image', value: 'images/backgrounds/' + file }, true);
    });
  }
  if (bgGradientForm && bgColorTop && bgColorBottom && bgColorLeft && bgColorRight) {
    bgGradientForm.addEventListener('submit', function (event) {
      event.preventDefault();
      applyBackgroundChoice(getColorChoiceFromControls(), true);
    });
    [bgColorTop, bgColorBottom, bgColorLeft, bgColorRight, bgColorOpacity].forEach(function (input) {
      if (!input) return;
      input.addEventListener('input', function () {
        applyBackgroundChoice(getColorChoiceFromControls(), true);
      });
    });
  }
  if (bgReset) {
    bgReset.addEventListener('click', function () {
      document.documentElement.style.removeProperty('--scene-bg-image');
      document.documentElement.style.removeProperty('--scene-bg-wash');
      try {
        localStorage.removeItem(bgStorageKey);
      } catch (error) {}
    });
  }

  var modalStage = document.getElementById('js-modal-stage');
  var modal = document.getElementById('js-prototype-modal');
  var projectTriggers = document.querySelectorAll('[data-project-open]');
  var authTriggers = document.querySelectorAll('[data-auth-open]');
  var modalMedia = document.getElementById('js-modal-media');
  var modalCategory = document.getElementById('js-modal-category');
  var modalTitle = document.getElementById('modal-title');
  var modalSubline = document.getElementById('js-modal-subline');
  var modalDesc = document.getElementById('modal-desc');
  var modalTags = document.getElementById('js-modal-tags');
  var modalActions = document.getElementById('js-modal-actions');
  var modalLoadingTimer = null;
  var lastModalTrigger = null;
  var modalIsOpen = false;
  var modalMode = 'project';
  var currentProjectIndex = 0;
  var currentGalleryImages = [];
  var lightboxIndex = 0;
  var lightboxStage = document.getElementById('js-lightbox-stage');
  var lightboxPanel = lightboxStage ? lightboxStage.querySelector('.lightbox-panel') : null;
  var lightboxImage = document.getElementById('js-lightbox-image');
  var lightboxCounter = document.getElementById('js-lightbox-counter');
  var lightboxTouchStartX = 0;

  var demoCredentials = {
    admin: { email: 'admin@pappenberg.design', password: 'Start-Admin-2026!' },
    user: { email: 'kunde@pappenberg.design', password: 'Projektblick-2026!' }
  };

  var projectData = [
    {
      id: 'cms-webhosting',
      category: 'Projekt 01 | CMS | Webhosting',
      title: 'Verbands-CMS',
      subline: 'Ein redaktionelles System für Inhalte, Veranstaltungen, interne Dokumente und klare Kommunikation.',
      desc: 'Die Detailansicht ist für spätere Case Studies vorbereitet: Projektziel, Leistungsumfang, Medien, Status und interne Kundendateien können hier zusammengeführt werden.',
      tags: ['CMS', 'All-Inkl', 'Mitgliederbereich', 'DSGVO'],
      images: ['images/tooplate-exhibit-09.jpg', 'images/tooplate-exhibit-08.jpg', 'images/tooplate-exhibit-12.jpg', 'images/tooplate-exhibit-06.jpg']
    },
    {
      id: 'anzeigenkampagne',
      category: 'Projekt 02 | Kampagne',
      title: 'Anzeigenkampagne',
      subline: 'Von der visuellen Anzeige bis zur Conversion-orientierten Projektseite.',
      desc: 'Die Projektseite kann später Kampagnenmaterial, Kennzahlen, Varianten und Freigaben bündeln. Für Kunden wäre nur der jeweils freigegebene Bereich sichtbar.',
      tags: ['Landingpage', 'Anzeigen', 'Tracking', 'Freigabe'],
      images: ['images/tooplate-exhibit-02.jpg', 'images/tooplate-exhibit-03.jpg', 'images/tooplate-exhibit-04.jpg']
    },
    {
      id: 'digitale-workflows',
      category: 'Projekt 03 | Automation',
      title: 'Digitale Workflows',
      subline: 'Abläufe werden dokumentiert, automatisiert und im Alltag leichter steuerbar.',
      desc: 'Diese Ansicht eignet sich als lebendes Projektdossier: Prozesskarte, Aufgabenstatus, Uploads, Links und nächste Schritte bleiben an einem Ort.',
      tags: ['Automation', 'KI', 'Prozesse', 'Dokumentation'],
      images: ['images/tooplate-exhibit-05.jpg', 'images/tooplate-exhibit-10.jpg', 'images/tooplate-exhibit-11.jpg']
    },
    {
      id: 'gute-websites',
      category: 'Projekt 04 | Webdesign',
      title: 'Gute Websites',
      subline: 'Struktur, Inhalt, Design und Technik greifen sichtbar ineinander.',
      desc: 'Für öffentliche Besucher entsteht eine ruhige Case Study. Für dich als Admin entsteht später dieselbe Fläche als Redaktionsmaske.',
      tags: ['Webdesign', 'UX', 'Content', 'Performance'],
      images: ['images/tooplate-exhibit-01.jpg', 'images/tooplate-exhibit-07.jpg', 'images/tooplate-exhibit-08.jpg']
    },
    {
      id: 'ki-entlastung',
      category: 'Projekt 05 | KI im Alltag',
      title: 'KI im Alltag',
      subline: 'Praktische Assistenz für Texte, Planung, Recherche und Kundenkommunikation.',
      desc: 'Sinnvoll wäre hier ein geschützter Downloadbereich für Leitfäden, Vorlagen, Prompt-Sammlungen und Projektprotokolle.',
      tags: ['KI', 'Vorlagen', 'Beratung', 'Entlastung'],
      images: ['images/tooplate-exhibit-12.jpg', 'images/tooplate-exhibit-06.jpg', 'images/tooplate-exhibit-09.jpg']
    },
    {
      id: 'ki-content',
      category: 'Projekt 06 | Content Creation',
      title: 'KI-Content',
      subline: 'Planbare Inhalte mit wiedererkennbarem visuellen und sprachlichen Stil.',
      desc: 'Das Modal kann Redaktionsplan, Bildvarianten, Textversionen, Freigaben und veröffentlichte Inhalte zusammenführen.',
      tags: ['Content', 'Social Media', 'Bildsprache', 'Freigabe'],
      images: ['images/tooplate-exhibit-03.jpg', 'images/tooplate-exhibit-11.jpg', 'images/tooplate-exhibit-05.jpg']
    },
    {
      id: 'workflow-beratung',
      category: 'Projekt 07 | Beratung',
      title: 'Workflow-Beratung',
      subline: 'Kleine Systeme, die Ordnung schaffen, ohne den Alltag schwerer zu machen.',
      desc: 'Für kundenspezifische Dinge empfiehlt sich später ein Rollenmodell mit getrennten Kundenbereichen, Ablaufprotokoll und zeitlich begrenzten Downloadlinks.',
      tags: ['Beratung', 'Kundenbereich', 'Ablage', 'Rollen'],
      images: ['images/tooplate-exhibit-04.jpg', 'images/tooplate-exhibit-10.jpg', 'images/tooplate-exhibit-02.jpg']
    }
  ];

  function setModalLoading(active) {
    if (!modal) return;
    modal.classList.toggle('is-loading', active);
  }

  function renderProjectModal(project) {
    if (!project || !modalMedia || !modalTitle || !modalSubline || !modalDesc || !modalCategory || !modalTags || !modalActions) return;
    var images = project.images.slice(0, 5);
    currentGalleryImages = images;
    modalCategory.textContent = project.category;
    modalTitle.textContent = project.title;
    modalSubline.textContent = project.subline;
    modalDesc.textContent = project.desc;
    modalTags.innerHTML = project.tags.map(function (tag) {
      return '<span class="modal-tag">' + tag + '</span>';
    }).join('');
    modalMedia.innerHTML = '<button class="modal-project-image" type="button" data-gallery-open aria-label="Projektgalerie öffnen"><img src="' + images[0] + '" alt="' + project.title + '"><span>' + images.length + ' Bilder</span></button>';
    modalActions.hidden = false;
  }

  function renderLightbox() {
    if (!lightboxImage || !lightboxCounter || !currentGalleryImages.length) return;
    lightboxIndex = (lightboxIndex + currentGalleryImages.length) % currentGalleryImages.length;
    lightboxImage.src = currentGalleryImages[lightboxIndex];
    lightboxImage.alt = 'Projektbild ' + (lightboxIndex + 1);
    lightboxCounter.textContent = (lightboxIndex + 1) + ' / ' + currentGalleryImages.length;
  }

  function openLightbox(index) {
    if (!lightboxStage || !currentGalleryImages.length) return;
    lightboxIndex = index || 0;
    renderLightbox();
    lightboxStage.hidden = false;
    lightboxStage.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-modal-locked');
    window.requestAnimationFrame(function () {
      lightboxStage.classList.add('is-open');
      if (lightboxPanel) lightboxPanel.focus({ preventScroll: true });
    });
  }

  function closeLightbox() {
    if (!lightboxStage || lightboxStage.hidden) return;
    lightboxStage.classList.remove('is-open');
    window.setTimeout(function () {
      lightboxStage.hidden = true;
      lightboxStage.setAttribute('aria-hidden', 'true');
      if (!modalIsOpen) document.body.classList.remove('is-modal-locked');
      if (modal && modalIsOpen) modal.focus({ preventScroll: true });
    }, reducedMotion ? 0 : 260);
  }

  function stepLightbox(delta) {
    lightboxIndex += delta;
    renderLightbox();
  }

  function renderAuthModal(type) {
    if (!modalMedia || !modalTitle || !modalSubline || !modalDesc || !modalCategory || !modalTags || !modalActions) return;
    var isAdmin = type === 'admin';
    modalCategory.textContent = isAdmin ? 'Interner Bereich | Admin' : 'Interner Bereich | User';
    modalTitle.textContent = isAdmin ? 'Admin-Bereich vorbereiten' : 'Kundenbereich vorbereiten';
    modalSubline.textContent = isAdmin ? 'Projektinhalte hochladen, prüfen und veröffentlichen.' : 'Freigegebene Projektinhalte, Dateien und Statusmeldungen ansehen.';
    modalDesc.textContent = 'Diese Demo läuft lokal im Browser. Produktiv müssen Logins serverseitig mit HTTPS, Sessions, Passwort-Hashing, Rollen und DSGVO-konformer Datenhaltung umgesetzt werden.';
    modalTags.innerHTML = ['HTTPS', '2FA', 'Rollen', 'Backups', 'AV-Vertrag'].map(function (tag) {
      return '<span class="modal-tag">' + tag + '</span>';
    }).join('');
    modalActions.hidden = true;
    modalMedia.innerHTML =
      '<div class="auth-panel">' +
        '<div class="auth-state">Demo-Zugangsdaten</div>' +
        '<div class="auth-panel__grid">' +
          '<div class="auth-card"><h3>Admin</h3><p>' + demoCredentials.admin.email + '<br>' + demoCredentials.admin.password + '</p></div>' +
          '<div class="auth-card"><h3>User</h3><p>' + demoCredentials.user.email + '<br>' + demoCredentials.user.password + '</p></div>' +
        '</div>' +
        '<form class="admin-publish" id="js-admin-publish-form">' +
          '<h3>' + (isAdmin ? 'Inhalt bereitstellen' : 'Demo-Anmeldung') + '</h3>' +
          '<div class="form-field"><label for="auth-email">E-Mail</label><input id="auth-email" type="email" autocomplete="username" value="' + (isAdmin ? demoCredentials.admin.email : demoCredentials.user.email) + '"></div>' +
          '<div class="form-field"><label for="auth-password">Passwort</label><input id="auth-password" type="password" autocomplete="current-password" value="' + (isAdmin ? demoCredentials.admin.password : demoCredentials.user.password) + '"></div>' +
          (isAdmin ? '<div class="form-field"><label for="publish-title">Projekttitel</label><input id="publish-title" type="text" placeholder="Neues Projekt oder Kundeninhalt"></div><div class="form-field"><label for="publish-files">3 - 5 Bilder / Dateien</label><input id="publish-files" type="file" accept="image/*,.pdf" multiple></div><div class="admin-upload-preview" id="js-upload-preview" aria-live="polite"></div><div class="form-field"><label for="publish-note">Kurzbeschreibung</label><textarea id="publish-note" placeholder="Was soll veröffentlicht oder intern bereitgestellt werden?"></textarea></div>' : '') +
          '<button class="btn btn--ghost" type="submit">' + (isAdmin ? 'Speichern' : 'Demo öffnen') + '</button>' +
          '<p class="admin-note" id="js-admin-note">Für All-Inkl empfehle ich PHP 8.3, MySQL/MariaDB, serverseitige Sessions, Argon2id/bcrypt-Passworthashes, CSRF-Token, rollenbasierte Rechte und keine Klartext-Passwörter im Repository.</p>' +
        '</form>' +
      '</div>';
  }

  function openPrototypeModal(trigger, options) {
    if (!modalStage || !modal || modalIsOpen) return;
    modalIsOpen = true;
    lastModalTrigger = trigger || document.activeElement;
    modalMode = options && options.authType ? 'auth' : 'project';
    modal.classList.toggle('is-auth-modal', modalMode === 'auth');
    if (options && options.project) renderProjectModal(options.project);
    if (options && options.authType) renderAuthModal(options.authType);
    modalStage.hidden = false;
    modalStage.setAttribute('aria-hidden', 'false');
    modal.classList.remove('is-closing');
    setGlassOverlay(true);
    document.body.classList.add('is-modal-locked');
    setModalLoading(true);

    window.requestAnimationFrame(function () {
      modalStage.classList.add('is-open');
      modal.focus({ preventScroll: true });
    });

    window.clearTimeout(modalLoadingTimer);
    modalLoadingTimer = window.setTimeout(function () {
      setModalLoading(false);
    }, reducedMotion ? 0 : 900);
  }

  function closePrototypeModal(options) {
    if (!modalStage || !modal || !modalIsOpen) return;
    var delay = options && options.waitForSwitch ? 380 : 0;

    window.setTimeout(function () {
      modalIsOpen = false;
      window.clearTimeout(modalLoadingTimer);
      setModalLoading(false);
      modal.classList.add('is-closing');
      modalStage.classList.remove('is-open');
      setGlassOverlay(false);
      document.body.classList.remove('is-modal-locked');

      window.setTimeout(function () {
        modalStage.hidden = true;
        modalStage.setAttribute('aria-hidden', 'true');
        modal.classList.remove('is-closing');
        if (lastModalTrigger && typeof lastModalTrigger.focus === 'function') {
          lastModalTrigger.focus({ preventScroll: true });
        }
      }, reducedMotion ? 0 : 420);
    }, delay);
  }

  function openProjectById(id, trigger) {
    var index = projectData.findIndex(function (project) { return project.id === id; });
    if (index < 0) return;
    currentProjectIndex = index;
    if (modalIsOpen) {
      setModalLoading(true);
      window.setTimeout(function () {
        renderProjectModal(projectData[currentProjectIndex]);
        setModalLoading(false);
      }, reducedMotion ? 0 : 180);
      return;
    }
    openPrototypeModal(trigger, { project: projectData[currentProjectIndex] });
  }

  projectTriggers.forEach(function (trigger) {
    trigger.addEventListener('click', function () {
      openProjectById(trigger.getAttribute('data-project-open'), trigger);
    });
    trigger.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      openProjectById(trigger.getAttribute('data-project-open'), trigger);
    });
  });

  authTriggers.forEach(function (trigger) {
    trigger.addEventListener('click', function () {
      openPrototypeModal(trigger, { authType: trigger.getAttribute('data-auth-open') });
    });
  });

  if (modalStage) {
    modalStage.addEventListener('click', function (event) {
      if (event.target.closest('[data-modal-close]')) closePrototypeModal();
      if (event.target.closest('[data-gallery-open]')) openLightbox(0);
      if (modalMode === 'project' && event.target.closest('[data-project-prev]')) {
        currentProjectIndex = (currentProjectIndex - 1 + projectData.length) % projectData.length;
        renderProjectModal(projectData[currentProjectIndex]);
      }
      if (modalMode === 'project' && event.target.closest('[data-project-next]')) {
        currentProjectIndex = (currentProjectIndex + 1) % projectData.length;
        renderProjectModal(projectData[currentProjectIndex]);
      }
    });
    modalStage.addEventListener('submit', function (event) {
      if (!event.target.matches('#js-admin-publish-form')) return;
      event.preventDefault();
      var note = document.getElementById('js-admin-note');
      if (note) note.textContent = 'Demo gespeichert: Die echte Veröffentlichung braucht den serverseitigen Upload-/Freigabe-Endpunkt.';
    });
    modalStage.addEventListener('change', function (event) {
      if (!event.target.matches('#publish-files')) return;
      var preview = document.getElementById('js-upload-preview');
      if (!preview) return;
      var files = Array.from(event.target.files || []).slice(0, 5);
      preview.innerHTML = '';
      files.forEach(function (file) {
        if (file.type.indexOf('image/') === 0) {
          var image = document.createElement('img');
          image.alt = file.name;
          image.src = URL.createObjectURL(file);
          preview.appendChild(image);
          return;
        }
        var label = document.createElement('span');
        label.textContent = file.name;
        preview.appendChild(label);
      });
    });
  }

  if (lightboxStage) {
    lightboxStage.addEventListener('click', function (event) {
      if (event.target.closest('[data-lightbox-close]')) closeLightbox();
      if (event.target.closest('[data-lightbox-prev]')) stepLightbox(-1);
      if (event.target.closest('[data-lightbox-next]')) stepLightbox(1);
    });
    lightboxStage.addEventListener('touchstart', function (event) {
      lightboxTouchStartX = event.changedTouches[0].clientX;
    }, { passive: true });
    lightboxStage.addEventListener('touchend', function (event) {
      var diff = event.changedTouches[0].clientX - lightboxTouchStartX;
      if (Math.abs(diff) < 42) return;
      stepLightbox(diff > 0 ? -1 : 1);
    }, { passive: true });
  }

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && lightboxStage && !lightboxStage.hidden) {
      closeLightbox();
      return;
    }
    if (lightboxStage && !lightboxStage.hidden && event.key === 'ArrowLeft') {
      stepLightbox(-1);
      return;
    }
    if (lightboxStage && !lightboxStage.hidden && event.key === 'ArrowRight') {
      stepLightbox(1);
      return;
    }
    if (event.key === 'Escape' && modalIsOpen) closePrototypeModal();
    if (!modalIsOpen || modalMode !== 'project') return;
    if (event.key === 'ArrowLeft') {
      currentProjectIndex = (currentProjectIndex - 1 + projectData.length) % projectData.length;
      renderProjectModal(projectData[currentProjectIndex]);
    }
    if (event.key === 'ArrowRight') {
      currentProjectIndex = (currentProjectIndex + 1) % projectData.length;
      renderProjectModal(projectData[currentProjectIndex]);
    }
  });

  function pulseTarget(hash) {
    if (!hash || hash === '#') return;
    var target;
    try {
      target = document.querySelector(hash);
    } catch (error) {
      return;
    }
    if (!target) return;
    target.classList.remove('content-pulse');
    void target.offsetWidth;
    target.classList.add('content-pulse');
  }

  document.querySelectorAll('a[href^="#"], a[href^="index.html#"]').forEach(function (link) {
    link.addEventListener('click', function () {
      var hash = link.hash;
      window.setTimeout(function () {
        pulseTarget(hash);
      }, 120);
    });
  });

  var nav = document.querySelector('.site-nav');
  function updateNavState() {
    if (!nav) return;
    nav.classList.toggle('is-scrolled', window.scrollY > 12);
  }
  updateNavState();
  window.addEventListener('scroll', updateNavState, { passive: true });

  var revealItems = document.querySelectorAll('.reveal');

  if (reducedMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach(function (item) {
      item.classList.add('is-visible');
    });
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    revealItems.forEach(function (item) {
      observer.observe(item);
    });
  }

  var form = document.getElementById('js-contact-form');
  var submitBtn = document.getElementById('js-submit-btn');
  var successMsg = document.getElementById('js-success');

  function validateField(input) {
    var error = document.getElementById('err-' + input.id.replace('field-', ''));
    var valid = input.validity.valid;
    input.classList.toggle('is-invalid', !valid);
    if (error) error.classList.toggle('is-visible', !valid);
    return valid;
  }

  if (form) {
    var requiredFields = form.querySelectorAll('[required]');
    requiredFields.forEach(function (field) {
      field.addEventListener('blur', function () {
        validateField(field);
      });
      field.addEventListener('input', function () {
        if (field.classList.contains('is-invalid')) validateField(field);
      });
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var valid = Array.from(requiredFields).every(validateField);
      if (!valid) return;

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Anfrage vorbereitet';
      }
      if (successMsg) successMsg.hidden = false;
      form.reset();

      window.setTimeout(function () {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Projekt anfragen';
        }
      }, 1400);
    });
  }

  var year = document.getElementById('js-year');
  if (year) year.textContent = new Date().getFullYear();

  var banner = document.getElementById('js-cookie-banner');
  var accept = document.getElementById('js-cookie-accept');
  var decline = document.getElementById('js-cookie-decline');
  var settings = document.getElementById('js-cookie-settings');
  var storageKey = 'pappenbergCookieConsent';

  function setCookieChoice(choice) {
    try {
      localStorage.setItem(storageKey, choice);
    } catch (error) {
      document.cookie = storageKey + '=' + choice + '; max-age=31536000; path=/; SameSite=Lax';
    }
    if (banner) {
      banner.classList.add('is-closing');
      setGlassOverlay(false);
      window.setTimeout(function () {
        banner.hidden = true;
        banner.classList.remove('is-closing');
      }, reducedMotion ? 0 : 280);
    }
  }

  function hasCookieChoice() {
    try {
      return Boolean(localStorage.getItem(storageKey));
    } catch (error) {
      return document.cookie.indexOf(storageKey + '=') !== -1;
    }
  }

  if (banner && !hasCookieChoice()) {
    banner.hidden = false;
    setGlassOverlay(true);
  }
  if (accept) accept.addEventListener('click', function () { setCookieChoice('accepted'); });
  if (decline) decline.addEventListener('click', function () { setCookieChoice('declined'); });
  if (settings && banner) {
    settings.addEventListener('click', function () {
      if (banner.hidden) setGlassOverlay(true);
      banner.classList.remove('is-closing');
      banner.hidden = false;
      banner.querySelector('button').focus();
    });
  }
})();
