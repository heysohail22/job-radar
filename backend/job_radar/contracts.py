from urllib.parse import urlsplit
from uuid import UUID
from .database import ApiError

STAGES = ('applied', 'interview', 'offer', 'rejected', 'withdrawn')


def uuid(value):
    try:
        UUID(value)
        return value
    except (ValueError, TypeError):
        raise ApiError('Invalid ID.', 400) from None


def application_url(*values):
    for v in values:
        if not isinstance(v, str):
            continue
        try:
            p = urlsplit(v)
            if p.scheme in ('https', 'http') and p.hostname and not p.username and not p.password:
                return v
        except ValueError:
            pass
    return None


def map_job(r):
    text = lambda key, default=None: r.get(key) if isinstance(r.get(key), str) and r[key].strip() else default
    array = lambda key: [v for v in r.get(key, []) or [] if isinstance(v, str)]
    number = lambda key: r.get(key) if type(r.get(key)) in (int, float) else None
    return {
        'id': str(r['id']), 'matchId': text('match_id'), 'company': text('company', 'Company not listed'),
        'title': text('title', 'Untitled opportunity'), 'location': text('location_text'),
        'mode': text('work_mode', 'unknown'), 'eligibility': text('eligible_from_india', 'unclear'),
        'pay': text('compensation_text'), 'description': text('description'),
        'skills': array('required_skills'), 'preferredSkills': array('preferred_skills'),
        'responsibilities': array('responsibilities'), 'missing': array('missing_requirements'),
        'recommendation': text('recommendation'),
        'evidence': [v if isinstance(v, str) else v['evidence']
                     for v in r.get('matching_evidence', []) or []
                     if isinstance(v, str) or isinstance(v, dict) and isinstance(v.get('evidence'), str)],
        'score': number('total_score'),
        'breakdown': [{'label': label, 'value': number(key)} for label, key in (
            ('Technical', 'technical_score'), ('Projects', 'project_score'),
            ('Experience', 'experience_score'), ('Geography', 'geography_score'), ('Role', 'role_score'))
            if number(key) is not None],
        'applicationUrl': application_url(r.get('apply_url'), r.get('canonical_url')),
        'postingStatus': text('posting_status', 'uncertain'), 'firstSeen': text('first_seen_at'),
        'lastVerified': text('last_verified_at'), 'isSaved': r.get('is_saved') is True,
        'status': text('application_status', 'new'), 'revision': number('revision') or 0,
    }


def filters(p):
    def choice(key, default, allowed):
        v = p.get(key, default)
        if v not in allowed:
            raise ApiError('One of the filters is invalid.', 400)
        return v

    def integer(key, default, lower, upper):
        v = p.get(key, str(default))
        if not v.isascii() or not v.isdigit() or not lower <= int(v) <= upper:
            raise ApiError('Invalid numeric filter.', 400)
        return int(v)

    search, location = p.get('q', '').strip(), p.get('location', '').strip()
    if len(search) > 200 or len(location) > 100:
        raise ApiError('Your search is too long.', 400)
    return dict(p_search=search, p_location=location,
                p_mode=choice('mode', 'all', ('all', 'remote', 'onsite', 'hybrid', 'unknown')),
                p_posting=choice('posting', 'all', ('all', 'open', 'closed', 'uncertain')),
                p_sort=choice('sort', 'best', ('best', 'company', 'recent')),
                p_min_score=integer('score', 0, 0, 100),
                p_stage=choice('stage', 'all', ('all', *STAGES)),
                p_limit=20, p_offset=(integer('page', 1, 1, 100000) - 1) * 20)


def feed(db, params, view='discover', job_id=None, public=False):
    args = filters(params)
    if public:
        args.pop('p_min_score')
        args.pop('p_stage')
        if args['p_sort'] == 'best':
            args['p_sort'] = 'recent'
    else:
        args.update(p_profile=db.settings.job_radar_profile_version, p_view=view)
    if job_id:
        args['p_job_id'] = uuid(job_id)
    data = db.rpc('job_radar_public_feed' if public else 'job_radar_feed', args)
    if not isinstance(data, dict) or not isinstance(data.get('jobs'), list):
        raise ApiError('Jobs could not be loaded.', 502)
    return {'jobs': [map_job(r) for r in data['jobs']], 'total': data['total'],
            'summary': {**dict.fromkeys(('saved', 'applied', 'interview', 'offer', 'tracked'), 0),
                        **data.get('summary', {})}}


def mutate(db, match_id, body):
    uuid(match_id)
    if not isinstance(body, dict) or set(body) - {'revision', 'isSaved', 'status'}:
        raise ApiError('Invalid update.', 400)
    if type(body.get('revision')) is not int or not 0 <= body['revision'] <= 9007199254740991:
        raise ApiError('Refresh this job before updating it.', 400)
    if not {'isSaved', 'status'} & body.keys():
        raise ApiError('No changes were supplied.', 400)
    if 'isSaved' in body and type(body['isSaved']) is not bool:
        raise ApiError('Invalid bookmark value.', 400)
    if 'status' in body and body['status'] not in ('new', 'reviewed', *STAGES):
        raise ApiError('Invalid application status.', 400)
    return db.rpc('job_radar_update_state', dict(
        p_match_id=match_id, p_profile=db.settings.job_radar_profile_version,
        p_revision=body['revision'], p_is_saved=body.get('isSaved'), p_status=body.get('status')))
