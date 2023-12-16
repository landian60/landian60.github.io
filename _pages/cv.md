---
layout: archive
title: "Guanmin Liu's CV"
permalink: /cv/
author_profile: true
redirect_from:
  - /resume
---

{% include base_path %}

<style>
  .image-container {
      max-width: 60%;
      max-height: 60%;
  }
</style>

---

*EDUCATION*
======
* M.S. in Shanghai, **Tongji University** (recommended for admission), 2021-2024(expected)
* B.S. in Nanjing, **Hohai University**, 2017-2021


*WORK EXPERIENCE*
======
* September 2022 - September 2023: Research Intern
  * Ele.me, Alibaba Group
  * Study on multi-modal image generation and image editing

* September 2021 – May 2024: Postgraduate Student
  * Intelligence Information Processing Laboratory, Tongji University
  * Study on image-based 3D neural rendering representation and amodal segmentation
  <!-- * Supervisor: Zhihua Wei -->
  
* May 2018 – June 2021: Undergraduate Student
  * Robotics Motion and Vision Laboratory, Hohai University
  * Study on Visual SLAM

*TECHNICAL SKILLS & OTHERS*
======
* Programming Languages 
  * Python, C++, Java, JavaScript, MATLAB, Latex, SQL
* Frameworks and Platforms
  * Git, PyTorch, Linux, Flask, Unity 3D
* Hobbies
  * Martial Arts, Travelling, Creative Media Production

*PUBLICATIONS*
======
  <ul>
  {% assign sorted_publications = site.publications | sort: 'order' %}
  {% for post in sorted_publications %}
    <li>
      {% include archive-single-cv.html %}
      <p><strong>Author: </strong> {{ post.excerpt }}</p>
      <p><strong>Abstract:</strong> {{ post.abstract }}</p>
      <div class="image-container">
      <img src="{{ post.image }}" alt="{{'image'}}">
      </div>
    </li>
    <!-- {% include archive-single-cv.html %} -->
  {% endfor %}</ul>
  
<!-- Talks
======
  <ul>{% for post in site.talks %}
    {% include archive-single-talk-cv.html %}
  {% endfor %}</ul>
  
Teaching
======
  <ul>{% for post in site.teaching %}
    {% include archive-single-cv.html %}
  {% endfor %}</ul>
  
Service and leadership
======
* Currently signed in to 43 different slack teams -->
